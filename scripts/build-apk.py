#!/usr/bin/env python3
"""
Standalone Pure-Python Android APK Compiler for Periodic Table Arena
Generates a complete, 4-byte zipaligned, V1 + V2 cryptographically signed Android APK:
  - Binary AXML AndroidManifest.xml (minSdkVersion=21, targetSdkVersion=33, exported=true)
  - Binary resources.arsc + High-Res PNG App Icon (0x7f010000 -> res/drawable/icon.png)
  - Compiled Dalvik Bytecode classes.dex (MainActivity launching hardware-accelerated WebView)
  - Full offline web assets bundled under assets/www/
  - Signed with both JAR v1 (MANIFEST.MF/CERT.SF/CERT.RSA) and APK Signature Scheme v2
"""

import base64
import datetime
import hashlib
import io
import os
import struct
import zlib
import zipfile

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.serialization import pkcs7
from cryptography.x509.oid import NameOID

PACKAGE_NAME = "com.periodictable.arena"
APP_LABEL = "Periodic Lab"
ACTIVITY_NAME = "com.periodictable.arena.MainActivity"
ICON_RES_ID = 0x7F010000


# ============================================================================
# 1. Binary Android String Pool Encoder (UTF-16LE ResStringPool)
# ============================================================================

def build_string_pool(strings):
    """Build standard Android ResStringPool_header (UTF-16LE, type 0x0001)."""
    count = len(strings)
    encoded_blobs = []
    offsets = []
    cur = 0
    for s in strings:
        u16 = s.encode("utf-16le")
        nchars = len(s)
        blob = struct.pack("<H", nchars) + u16 + b"\x00\x00"
        offsets.append(cur)
        encoded_blobs.append(blob)
        cur += len(blob)

    strings_data = b"".join(encoded_blobs)
    pad = (4 - (len(strings_data) % 4)) % 4
    strings_data += b"\x00" * pad

    header_size = 28
    strings_start = header_size + count * 4
    total_size = strings_start + len(strings_data)

    header = struct.pack(
        "<HHIIIIII",
        0x0001,         # RES_STRING_POOL_TYPE
        header_size,    # headerSize = 28
        total_size,     # size
        count,          # stringCount
        0,              # styleCount
        0,              # flags (UTF-16LE)
        strings_start,  # stringsStart
        0,              # stylesStart
    )
    offset_table = b"".join(struct.pack("<I", o) for o in offsets)
    return header + offset_table + strings_data


# ============================================================================
# 2. Binary AXML AndroidManifest.xml Encoder
# ============================================================================

def build_binary_axml():
    ANDROID_NS = "http://schemas.android.com/apk/res/android"

    # Attribute resource IDs in android.R.attr MUST keep their exact indices at the start of string pool!
    attr_defs = [
        ("theme", 0x01010000),
        ("label", 0x01010001),
        ("icon", 0x01010002),
        ("name", 0x01010003),
        ("exported", 0x01010010),
        ("screenOrientation", 0x0101001E),
        ("configChanges", 0x0101001F),
        ("versionCode", 0x0101021B),
        ("versionName", 0x0101021C),
        ("minSdkVersion", 0x0101020C),
        ("targetSdkVersion", 0x01010270),
        ("hardwareAccelerated", 0x010102D3),
        ("usesCleartextTraffic", 0x010104EC),
    ]

    extra_strings = [
        "android",
        ANDROID_NS,
        "manifest",
        "package",
        PACKAGE_NAME,
        "1.0.0",
        "uses-sdk",
        "application",
        APP_LABEL,
        "activity",
        ACTIVITY_NAME,
        "intent-filter",
        "action",
        "android.intent.action.MAIN",
        "category",
        "android.intent.category.LAUNCHER",
    ]

    pool_list = [name for name, _ in attr_defs] + extra_strings
    sidx = {s: i for i, s in enumerate(pool_list)}

    sp_chunk = build_string_pool(pool_list)

    res_ids = [rid for _, rid in attr_defs]
    res_map_chunk = struct.pack("<HHII", 0x0180, 8, 8 + len(res_ids) * 4, res_ids[0])[0:8] + b"".join(
        struct.pack("<I", r) for r in res_ids
    )
    # Fix res_map_chunk exact header (type=0x0180, headerSize=8, size=8+4*N)
    res_map_chunk = struct.pack("<HHI", 0x0180, 8, 8 + len(res_ids) * 4) + b"".join(
        struct.pack("<I", r) for r in res_ids
    )

    def ns_start(prefix, uri, line=1):
        return struct.pack("<HHIIIIII", 0x0100, 16, 24, line, 0xFFFFFFFF, sidx[prefix], sidx[uri], 0)[0:24]

    def ns_end(prefix, uri, line=1):
        return struct.pack("<HHIIIIII", 0x0101, 16, 24, line, 0xFFFFFFFF, sidx[prefix], sidx[uri], 0)[0:24]

    # ResValue types
    TYPE_REFERENCE = 0x01
    TYPE_STRING = 0x03
    TYPE_INT_DEC = 0x10
    TYPE_INT_HEX = 0x11
    TYPE_INT_BOOL = 0x12

    def make_attr(ns_s, name_s, val_type, data_int, raw_str_s=None):
        ns_i = 0xFFFFFFFF if ns_s is None else sidx[ns_s]
        name_i = sidx[name_s]
        raw_i = sidx[raw_str_s] if raw_str_s is not None else 0xFFFFFFFF
        return struct.pack(
            "<IIIHBBI",
            ns_i,
            name_i,
            raw_i,
            8,          # typedValue.size
            0,          # typedValue.res0
            val_type,   # typedValue.dataType
            data_int & 0xFFFFFFFF,
        )

    def elem_start(tag_s, attrs, line=1):
        attr_bytes = b"".join(attrs)
        size = 36 + len(attr_bytes)
        return (
            struct.pack(
                "<HHIIIIIIHHHHHH",
                0x0102,          # RES_XML_START_ELEMENT_TYPE
                16,              # headerSize
                size,            # total chunk size
                line,
                0xFFFFFFFF,      # comment
                0xFFFFFFFF,      # ns
                sidx[tag_s],     # name
                20,              # attributeStart (offset from ext header)
                20,              # attributeSize
                len(attrs),      # attributeCount
                0,               # idIndex
                0,               # classIndex
                0,               # styleIndex
                0,
            )[0:36]
            + attr_bytes
        )

    def elem_end(tag_s, line=1):
        return struct.pack("<HHIIII", 0x0103, 16, 24, line, 0xFFFFFFFF, 0xFFFFFFFF) + struct.pack("<I", sidx[tag_s])
        # Wait: exact size of RES_XML_END_ELEMENT_TYPE is 24 bytes:
        # ResChunk_header (8) + lineNumber(4) + comment(4) + ns(4) + name(4) = 24 bytes!

    # Note: let's make ns_start, ns_end, elem_start, elem_end crystal-explicit struct packs!
    def chunk_start_ns(prefix, uri, line=1):
        return struct.pack("<HHIIII", 0x0100, 16, 24, line, 0xFFFFFFFF, sidx[prefix]) + struct.pack("<I", sidx[uri])

    def chunk_end_ns(prefix, uri, line=1):
        return struct.pack("<HHIIII", 0x0101, 16, 24, line, 0xFFFFFFFF, sidx[prefix]) + struct.pack("<I", sidx[uri])

    def chunk_start_elem(tag_s, attrs, line=1):
        attr_bytes = b"".join(attrs)
        return (
            struct.pack(
                "<HHIIIIIHHHHHH",
                0x0102,
                16,
                36 + len(attr_bytes),
                line,
                0xFFFFFFFF,
                0xFFFFFFFF,
                sidx[tag_s],
                20,
                20,
                len(attrs),
                0,
                0,
                0,
            )
            + attr_bytes
        )

    def chunk_end_elem(tag_s, line=1):
        return struct.pack("<HHIIIII", 0x0103, 16, 24, line, 0xFFFFFFFF, 0xFFFFFFFF, sidx[tag_s])

    # Note: attributes within an element should be ordered by resource ID where applicable
    manifest_attrs = [
        make_attr(ANDROID_NS, "versionCode", TYPE_INT_DEC, 1),
        make_attr(ANDROID_NS, "versionName", TYPE_STRING, sidx["1.0.0"], "1.0.0"),
        make_attr(None, "package", TYPE_STRING, sidx[PACKAGE_NAME], PACKAGE_NAME),
    ]

    sdk_attrs = [
        make_attr(ANDROID_NS, "minSdkVersion", TYPE_INT_DEC, 21),
        make_attr(ANDROID_NS, "targetSdkVersion", TYPE_INT_DEC, 33),
    ]

    app_attrs = [
        make_attr(ANDROID_NS, "theme", TYPE_REFERENCE, 0x01030007),  # Theme.Black.NoTitleBar.Fullscreen
        make_attr(ANDROID_NS, "label", TYPE_STRING, sidx[APP_LABEL], APP_LABEL),
        make_attr(ANDROID_NS, "icon", TYPE_REFERENCE, ICON_RES_ID),
        make_attr(ANDROID_NS, "hardwareAccelerated", TYPE_INT_BOOL, 0xFFFFFFFF),
        make_attr(ANDROID_NS, "usesCleartextTraffic", TYPE_INT_BOOL, 0xFFFFFFFF),
    ]

    # configChanges: keyboardHidden(0x20) | orientation(0x80) | screenLayout(0x100) | screenSize(0x400) = 0x05A0
    # screenOrientation: 6 = SCREEN_ORIENTATION_SENSOR_LANDSCAPE (opens immediately in Fullscreen Landscape!)
    act_attrs = [
        make_attr(ANDROID_NS, "label", TYPE_STRING, sidx[APP_LABEL], APP_LABEL),
        make_attr(ANDROID_NS, "name", TYPE_STRING, sidx[ACTIVITY_NAME], ACTIVITY_NAME),
        make_attr(ANDROID_NS, "exported", TYPE_INT_BOOL, 0xFFFFFFFF),
        make_attr(ANDROID_NS, "screenOrientation", TYPE_INT_DEC, 6),
        make_attr(ANDROID_NS, "configChanges", TYPE_INT_HEX, 0x05A0),
    ]

    action_attrs = [
        make_attr(ANDROID_NS, "name", TYPE_STRING, sidx["android.intent.action.MAIN"], "android.intent.action.MAIN"),
    ]
    cat_attrs = [
        make_attr(ANDROID_NS, "name", TYPE_STRING, sidx["android.intent.category.LAUNCHER"], "android.intent.category.LAUNCHER"),
    ]

    body = b"".join([
        sp_chunk,
        res_map_chunk,
        chunk_start_ns("android", ANDROID_NS, 2),
        chunk_start_elem("manifest", manifest_attrs, 2),
        chunk_start_elem("uses-sdk", sdk_attrs, 3),
        chunk_end_elem("uses-sdk", 3),
        chunk_start_elem("application", app_attrs, 4),
        chunk_start_elem("activity", act_attrs, 5),
        chunk_start_elem("intent-filter", [], 6),
        chunk_start_elem("action", action_attrs, 7),
        chunk_end_elem("action", 7),
        chunk_start_elem("category", cat_attrs, 8),
        chunk_end_elem("category", 8),
        chunk_end_elem("intent-filter", 6),
        chunk_end_elem("activity", 5),
        chunk_end_elem("application", 4),
        chunk_end_elem("manifest", 2),
        chunk_end_ns("android", ANDROID_NS, 2),
    ])

    return struct.pack("<HHI", 0x0003, 8, 8 + len(body)) + body


# ============================================================================
# 3. Binary resources.arsc Encoder (Maps 0x7f010000 -> res/drawable/icon.png)
# ============================================================================

def build_resources_arsc():
    global_pool = build_string_pool(["res/drawable/icon.png"])
    type_pool = build_string_pool(["drawable"])
    key_pool = build_string_pool(["icon"])

    # ResTable_typeSpec (type=0x0202, headerSize=16, id=1, res0=0, res1=0, entryCount=1)
    type_spec = struct.pack("<HHIBBHII", 0x0202, 16, 20, 1, 0, 0, 1, 0)

    # ResTable_entry (size=8, flags=0, key=0) + Res_value (size=8, res0=0, dataType=TYPE_STRING(0x03), data=0)
    entry_bytes = struct.pack("<HHI", 8, 0, 0) + struct.pack("<HBBI", 8, 0, 0x03, 0)

    # ResTable_config = 52 bytes (size field = 52 + 48 zero bytes)
    config_bytes = struct.pack("<I", 52) + (b"\x00" * 48)
    type_header_size = 20 + len(config_bytes)  # 72 bytes
    entries_start = type_header_size + 4      # 1 offset * 4 bytes = 76
    type_chunk_size = entries_start + len(entry_bytes)

    type_chunk = (
        struct.pack(
            "<HHIBBHII",
            0x0201,             # RES_TABLE_TYPE_TYPE
            type_header_size,   # headerSize = 72
            type_chunk_size,    # size
            1,                  # id = 1 (0x7f01xxxx)
            0,
            0,
            1,                  # entryCount = 1
            entries_start,      # entriesStart
        )
        + config_bytes
        + struct.pack("<I", 0)  # entry offset[0] = 0
        + entry_bytes
    )

    # ResTable_package header = 288 bytes (type=0x0200, headerSize=288)
    pkg_name_u16 = PACKAGE_NAME.encode("utf-16le").ljust(256, b"\x00")
    pkg_header_size = 288
    type_strings_offset = pkg_header_size
    key_strings_offset = pkg_header_size + len(type_pool)
    pkg_body = type_pool + key_pool + type_spec + type_chunk
    pkg_chunk = (
        struct.pack("<HHII", 0x0200, pkg_header_size, pkg_header_size + len(pkg_body), 0x7F)
        + pkg_name_u16
        + struct.pack("<IIIII", type_strings_offset, 0, key_strings_offset, 0, 0)
        + pkg_body
    )

    total_size = 12 + len(global_pool) + len(pkg_chunk)
    table_header = struct.pack("<HHII", 0x0002, 12, total_size, 1)
    return table_header + global_pool + pkg_chunk


# ============================================================================
# 4. Pure-Python Dalvik classes.dex Assembler (MainActivity -> WebView)
# ============================================================================

def uleb128(val):
    out = bytearray()
    while True:
        byte = val & 0x7F
        val >>= 7
        if val != 0:
            out.append(byte | 0x80)
        else:
            out.append(byte)
            break
    return bytes(out)


def build_classes_dex():
    raw_strings = [
        "<init>",
        "I",
        "Landroid/app/Activity;",
        "Landroid/content/Context;",
        "Landroid/os/Bundle;",
        "Landroid/view/View;",
        "Landroid/view/Window;",
        "Landroid/webkit/WebChromeClient;",
        "Landroid/webkit/WebSettings;",
        "Landroid/webkit/WebView;",
        "Landroid/webkit/WebViewClient;",
        "Lcom/periodictable/arena/MainActivity;",
        "Ljava/lang/String;",
        "V",
        "VL",
        "VI",
        "VZ",
        "Z",
        "ZI",
        "canGoBack",
        "file:///android_asset/www/index.html",
        "getDecorView",
        "getSettings",
        "getWindow",
        "goBack",
        "loadUrl",
        "onBackPressed",
        "onCreate",
        "onWindowFocusChanged",
        "requestWindowFeature",
        "setAllowFileAccess",
        "setAllowUniversalAccessFromFileURLs",
        "setBackgroundColor",
        "setContentView",
        "setDomStorageEnabled",
        "setJavaScriptEnabled",
        "setMediaPlaybackRequiresUserGesture",
        "setRequestedOrientation",
        "setSystemUiVisibility",
        "setWebChromeClient",
        "setWebViewClient",
        "webView",
        "L",
    ]
    strings = sorted(set(raw_strings))
    s_idx = {s: i for i, s in enumerate(strings)}

    type_descs = sorted([
        "I",
        "Landroid/app/Activity;",
        "Landroid/content/Context;",
        "Landroid/os/Bundle;",
        "Landroid/view/View;",
        "Landroid/view/Window;",
        "Landroid/webkit/WebChromeClient;",
        "Landroid/webkit/WebSettings;",
        "Landroid/webkit/WebView;",
        "Landroid/webkit/WebViewClient;",
        "Lcom/periodictable/arena/MainActivity;",
        "Ljava/lang/String;",
        "V",
        "Z",
    ], key=lambda t: s_idx[t])
    t_idx = {t: i for i, t in enumerate(type_descs)}

    # Protos: (shorty, return_type, (param_types...))
    raw_protos = [
        ("V", "V", ()),
        ("VI", "V", ("I",)),
        ("VL", "V", ("Landroid/content/Context;",)),
        ("VL", "V", ("Landroid/os/Bundle;",)),
        ("VL", "V", ("Landroid/view/View;",)),
        ("VL", "V", ("Landroid/webkit/WebChromeClient;",)),
        ("VL", "V", ("Landroid/webkit/WebViewClient;",)),
        ("VL", "V", ("Ljava/lang/String;",)),
        ("VZ", "V", ("Z",)),
        ("L", "Landroid/view/View;", ()),
        ("L", "Landroid/view/Window;", ()),
        ("L", "Landroid/webkit/WebSettings;", ()),
        ("Z", "Z", ()),
        ("ZI", "Z", ("I",)),
    ]
    protos = sorted(raw_protos, key=lambda p: (t_idx[p[1]], tuple(t_idx[x] for x in p[2])))
    p_idx = {(p[1], p[2]): i for i, p in enumerate(protos)}

    # Fields: (class_type, field_type, name)
    fields = [
        ("Lcom/periodictable/arena/MainActivity;", "Landroid/webkit/WebView;", "webView"),
    ]
    f_idx = {f: i for i, f in enumerate(fields)}

    # Methods: (class_type, name, (ret_type, (params...)))
    raw_methods = [
        ("Landroid/app/Activity;", "<init>", ("V", ())),
        ("Landroid/app/Activity;", "getWindow", ("Landroid/view/Window;", ())),
        ("Landroid/app/Activity;", "onBackPressed", ("V", ())),
        ("Landroid/app/Activity;", "onCreate", ("V", ("Landroid/os/Bundle;",))),
        ("Landroid/app/Activity;", "onWindowFocusChanged", ("V", ("Z",))),
        ("Landroid/app/Activity;", "requestWindowFeature", ("Z", ("I",))),
        ("Landroid/app/Activity;", "setContentView", ("V", ("Landroid/view/View;",))),
        ("Landroid/app/Activity;", "setRequestedOrientation", ("V", ("I",))),
        ("Landroid/view/View;", "setSystemUiVisibility", ("V", ("I",))),
        ("Landroid/view/Window;", "getDecorView", ("Landroid/view/View;", ())),
        ("Landroid/webkit/WebChromeClient;", "<init>", ("V", ())),
        ("Landroid/webkit/WebSettings;", "setAllowFileAccess", ("V", ("Z",))),
        ("Landroid/webkit/WebSettings;", "setAllowUniversalAccessFromFileURLs", ("V", ("Z",))),
        ("Landroid/webkit/WebSettings;", "setDomStorageEnabled", ("V", ("Z",))),
        ("Landroid/webkit/WebSettings;", "setJavaScriptEnabled", ("V", ("Z",))),
        ("Landroid/webkit/WebSettings;", "setMediaPlaybackRequiresUserGesture", ("V", ("Z",))),
        ("Landroid/webkit/WebView;", "<init>", ("V", ("Landroid/content/Context;",))),
        ("Landroid/webkit/WebView;", "canGoBack", ("Z", ())),
        ("Landroid/webkit/WebView;", "getSettings", ("Landroid/webkit/WebSettings;", ())),
        ("Landroid/webkit/WebView;", "goBack", ("V", ())),
        ("Landroid/webkit/WebView;", "loadUrl", ("V", ("Ljava/lang/String;",))),
        ("Landroid/webkit/WebView;", "setBackgroundColor", ("V", ("I",))),
        ("Landroid/webkit/WebView;", "setWebChromeClient", ("V", ("Landroid/webkit/WebChromeClient;",))),
        ("Landroid/webkit/WebView;", "setWebViewClient", ("V", ("Landroid/webkit/WebViewClient;",))),
        ("Landroid/webkit/WebViewClient;", "<init>", ("V", ())),
        ("Lcom/periodictable/arena/MainActivity;", "<init>", ("V", ())),
        ("Lcom/periodictable/arena/MainActivity;", "onBackPressed", ("V", ())),
        ("Lcom/periodictable/arena/MainActivity;", "onCreate", ("V", ("Landroid/os/Bundle;",))),
        ("Lcom/periodictable/arena/MainActivity;", "onWindowFocusChanged", ("V", ("Z",))),
    ]
    methods = sorted(raw_methods, key=lambda m: (t_idx[m[0]], s_idx[m[1]], p_idx[m[2]]))
    m_idx = {m: i for i, m in enumerate(methods)}

    # Helper instruction encoders (little-endian 16-bit Dalvik code units)
    def op_10x(op):
        return struct.pack("<H", op)

    def op_11n(op, vA, lit4):
        return struct.pack("<H", op | ((vA & 0xF) << 8) | ((lit4 & 0xF) << 12))

    def op_11x(op, vAA):
        return struct.pack("<H", op | ((vAA & 0xFF) << 8))

    def op_21c(op, vAA, idx16):
        return struct.pack("<HH", op | ((vAA & 0xFF) << 8), idx16)

    def op_21t(op, vAA, branch_units):
        return struct.pack("<Hh", op | ((vAA & 0xFF) << 8), branch_units)

    def op_22c(op, vA, vB, idx16):
        return struct.pack("<HH", op | ((vA & 0xF) << 8) | ((vB & 0xF) << 12), idx16)

    def op_31i(op, vAA, lit32_unsigned):
        return struct.pack("<HI", op | ((vAA & 0xFF) << 8), lit32_unsigned & 0xFFFFFFFF)

    def op_35c(op, regs, idx16):
        cnt = len(regs)
        r = list(regs) + [0] * (5 - cnt)
        w0 = op | (cnt << 12) | ((r[4] & 0xF) << 8)
        w2 = (r[0] & 0xF) | ((r[1] & 0xF) << 4) | ((r[2] & 0xF) << 8) | ((r[3] & 0xF) << 12)
        return struct.pack("<HHH", w0, idx16, w2)

    def make_code_item(registers_size, ins_size, outs_size, insn_bytes):
        insns_count = len(insn_bytes) // 2
        hdr = struct.pack("<HHHHII", registers_size, ins_size, outs_size, 0, 0, insns_count)
        raw = hdr + insn_bytes
        if len(raw) % 4 != 0:
            raw += b"\x00\x00"
        return raw

    # Code 1: MainActivity.<init>()V
    code_init = make_code_item(
        1, 1, 1,
        b"".join([
            op_35c(0x70, [0], m_idx[("Landroid/app/Activity;", "<init>", ("V", ()))]),
            op_10x(0x0E),
        ])
    )

    # Code 2: MainActivity.onCreate(Bundle)V -> v4 = this, v5 = bundle
    f_webview = f_idx[("Lcom/periodictable/arena/MainActivity;", "Landroid/webkit/WebView;", "webView")]
    code_oncreate = make_code_item(
        6, 2, 2,
        b"".join([
            op_35c(0x6F, [4, 5], m_idx[("Landroid/app/Activity;", "onCreate", ("V", ("Landroid/os/Bundle;",)))]),
            op_11n(0x12, 0, 1),  # v0 = true / 1
            op_35c(0x6E, [4, 0], m_idx[("Landroid/app/Activity;", "requestWindowFeature", ("Z", ("I",)))]),
            op_11n(0x12, 3, 6),  # SCREEN_ORIENTATION_SENSOR_LANDSCAPE = 6
            op_35c(0x6E, [4, 3], m_idx[("Landroid/app/Activity;", "setRequestedOrientation", ("V", ("I",)))]),
            op_35c(0x6E, [4], m_idx[("Landroid/app/Activity;", "getWindow", ("Landroid/view/Window;", ()))]),
            op_11x(0x0C, 2),
            op_35c(0x6E, [2], m_idx[("Landroid/view/Window;", "getDecorView", ("Landroid/view/View;", ()))]),
            op_11x(0x0C, 2),
            op_31i(0x14, 3, 0x00001706),  # IMMERSIVE_STICKY | FULLSCREEN | HIDE_NAVIGATION | LAYOUT_FULLSCREEN | LAYOUT_HIDE_NAVIGATION | LAYOUT_STABLE
            op_35c(0x6E, [2, 3], m_idx[("Landroid/view/View;", "setSystemUiVisibility", ("V", ("I",)))]),
            op_21c(0x22, 1, t_idx["Landroid/webkit/WebView;"]),
            op_35c(0x70, [1, 4], m_idx[("Landroid/webkit/WebView;", "<init>", ("V", ("Landroid/content/Context;",)))]),
            op_22c(0x5B, 1, 4, f_webview),  # this.webView = v1
            op_35c(0x6E, [1], m_idx[("Landroid/webkit/WebView;", "getSettings", ("Landroid/webkit/WebSettings;", ()))]),
            op_11x(0x0C, 2),  # v2 = settings
            op_35c(0x6E, [2, 0], m_idx[("Landroid/webkit/WebSettings;", "setJavaScriptEnabled", ("V", ("Z",)))]),
            op_35c(0x6E, [2, 0], m_idx[("Landroid/webkit/WebSettings;", "setDomStorageEnabled", ("V", ("Z",)))]),
            op_35c(0x6E, [2, 0], m_idx[("Landroid/webkit/WebSettings;", "setAllowFileAccess", ("V", ("Z",)))]),
            op_35c(0x6E, [2, 0], m_idx[("Landroid/webkit/WebSettings;", "setAllowUniversalAccessFromFileURLs", ("V", ("Z",)))]),
            op_11n(0x12, 3, 0),  # v3 = false
            op_35c(0x6E, [2, 3], m_idx[("Landroid/webkit/WebSettings;", "setMediaPlaybackRequiresUserGesture", ("V", ("Z",)))]),
            op_31i(0x14, 3, 0xFF0A0E17),  # zero white flash dark #0a0e17 background
            op_35c(0x6E, [1, 3], m_idx[("Landroid/webkit/WebView;", "setBackgroundColor", ("V", ("I",)))]),
            op_21c(0x22, 3, t_idx["Landroid/webkit/WebChromeClient;"]),
            op_35c(0x70, [3], m_idx[("Landroid/webkit/WebChromeClient;", "<init>", ("V", ()))]),
            op_35c(0x6E, [1, 3], m_idx[("Landroid/webkit/WebView;", "setWebChromeClient", ("V", ("Landroid/webkit/WebChromeClient;",)))]),
            op_21c(0x22, 3, t_idx["Landroid/webkit/WebViewClient;"]),
            op_35c(0x70, [3], m_idx[("Landroid/webkit/WebViewClient;", "<init>", ("V", ()))]),
            op_35c(0x6E, [1, 3], m_idx[("Landroid/webkit/WebView;", "setWebViewClient", ("V", ("Landroid/webkit/WebViewClient;",)))]),
            op_35c(0x6E, [4, 1], m_idx[("Landroid/app/Activity;", "setContentView", ("V", ("Landroid/view/View;",)))]),
            op_21c(0x1A, 3, s_idx["file:///android_asset/www/index.html"]),
            op_35c(0x6E, [1, 3], m_idx[("Landroid/webkit/WebView;", "loadUrl", ("V", ("Ljava/lang/String;",)))]),
            op_10x(0x0E),
        ])
    )

    # Code 3: MainActivity.onBackPressed()V -> v2 = this
    # Layout in 16-bit units:
    #   [0..1] iget-object v0, v2, webView (2)
    #   [2..3] if-eqz v0, +10 -> jumps to unit 12 (2)
    #   [4..6] invoke-virtual {v0}, canGoBack (3)
    #   [7]    move-result v1 (1)
    #   [8..9] if-eqz v1, +4 -> jumps to unit 12 (2)
    #   [10..12? wait: 2+2+3+1+2 = 10; invoke-virtual goBack is 3 units (10..12), return-void is 1 unit (13) -> super is at unit 14!]
    # Let's check exact offsets cleanly:
    #   0: iget-object (len 2 -> next=2)
    #   2: if-eqz v0, target=14 -> offset = 14 - 2 = +12! (len 2 -> next=4)
    #   4: invoke-virtual canGoBack (len 3 -> next=7)
    #   7: move-result v1 (len 1 -> next=8)
    #   8: if-eqz v1, target=14 -> offset = 14 - 8 = +6! (len 2 -> next=10)
    #  10: invoke-virtual goBack (len 3 -> next=13)
    #  13: return-void (len 1 -> next=14)
    #  14: invoke-super onBackPressed (len 3 -> next=17)
    #  17: return-void (len 1 -> total=18 units)
    code_onback = make_code_item(
        3, 1, 1,
        b"".join([
            op_22c(0x54, 0, 2, f_webview),
            op_21t(0x38, 0, 12),
            op_35c(0x6E, [0], m_idx[("Landroid/webkit/WebView;", "canGoBack", ("Z", ()))]),
            op_11x(0x0A, 1),
            op_21t(0x38, 1, 6),
            op_35c(0x6E, [0], m_idx[("Landroid/webkit/WebView;", "goBack", ("V", ()))]),
            op_10x(0x0E),
            op_35c(0x6F, [2], m_idx[("Landroid/app/Activity;", "onBackPressed", ("V", ()))]),
            op_10x(0x0E),
        ])
    )

    # Code 4: MainActivity.onWindowFocusChanged(Z)V -> v3 = this, v4 = hasFocus
    # Keeps edge-to-edge Immersive Sticky Fullscreen active whenever app regains focus!
    code_onfocus = make_code_item(
        5, 2, 2,
        b"".join([
            op_35c(0x6F, [3, 4], m_idx[("Landroid/app/Activity;", "onWindowFocusChanged", ("V", ("Z",)))]),
            op_21t(0x38, 4, 16),
            op_35c(0x6E, [3], m_idx[("Landroid/app/Activity;", "getWindow", ("Landroid/view/Window;", ()))]),
            op_11x(0x0C, 0),
            op_35c(0x6E, [0], m_idx[("Landroid/view/Window;", "getDecorView", ("Landroid/view/View;", ()))]),
            op_11x(0x0C, 1),
            op_31i(0x14, 2, 0x00001706),
            op_35c(0x6E, [1, 2], m_idx[("Landroid/view/View;", "setSystemUiVisibility", ("V", ("I",)))]),
            op_10x(0x0E),
        ])
    )

    # Assemble entire DEX stream cleanly with 4-byte alignment
    buf = bytearray(0x70)  # placeholder header

    def align4():
        while len(buf) % 4 != 0:
            buf.append(0)

    string_ids_off = len(buf)
    buf.extend(b"\x00" * (len(strings) * 4))

    align4()
    type_ids_off = len(buf)
    for t in type_descs:
        buf.extend(struct.pack("<I", s_idx[t]))

    align4()
    proto_ids_off = len(buf)
    buf.extend(b"\x00" * (len(protos) * 12))

    align4()
    field_ids_off = len(buf)
    for cls_t, fld_t, name_s in fields:
        buf.extend(struct.pack("<HHI", t_idx[cls_t], t_idx[fld_t], s_idx[name_s]))

    align4()
    method_ids_off = len(buf)
    for cls_t, name_s, proto_key in methods:
        buf.extend(struct.pack("<HHI", t_idx[cls_t], p_idx[proto_key], s_idx[name_s]))

    align4()
    class_defs_off = len(buf)
    buf.extend(b"\x00" * 32)  # 1 class_def_item

    # Data section starts here!
    align4()
    data_off = len(buf)

    # Type lists for prototypes that take parameters
    unique_param_tuples = []
    for _, _, params in protos:
        if params and params not in unique_param_tuples:
            unique_param_tuples.append(params)

    type_list_offsets = {}
    for params in unique_param_tuples:
        align4()
        type_list_offsets[params] = len(buf)
        buf.extend(struct.pack("<I", len(params)))
        for p in params:
            buf.extend(struct.pack("<H", t_idx[p]))

    # Patch proto_ids table now that type_list_offsets are known
    for i, (shorty, ret_t, params) in enumerate(protos):
        p_off = proto_ids_off + i * 12
        tl_off = type_list_offsets.get(params, 0)
        buf[p_off : p_off + 12] = struct.pack("<III", s_idx[shorty], t_idx[ret_t], tl_off)

    # Emit code_items (4-byte aligned)
    align4()
    code_init_off = len(buf)
    buf.extend(code_init)

    align4()
    code_onback_off = len(buf)
    buf.extend(code_onback)

    align4()
    code_oncreate_off = len(buf)
    buf.extend(code_oncreate)

    align4()
    code_onfocus_off = len(buf)
    buf.extend(code_onfocus)

    # Emit string_data_items
    string_data_off = len(buf)
    for i, s in enumerate(strings):
        utf8_bytes = s.encode("utf-8")
        item_off = len(buf)
        struct.pack_into("<I", buf, string_ids_off + i * 4, item_off)
        buf.extend(uleb128(len(s)))
        buf.extend(utf8_bytes + b"\x00")

    # Emit class_data_item for MainActivity
    m_main_init = m_idx[("Lcom/periodictable/arena/MainActivity;", "<init>", ("V", ()))]
    m_main_back = m_idx[("Lcom/periodictable/arena/MainActivity;", "onBackPressed", ("V", ()))]
    m_main_create = m_idx[("Lcom/periodictable/arena/MainActivity;", "onCreate", ("V", ("Landroid/os/Bundle;",)))]
    m_main_focus = m_idx[("Lcom/periodictable/arena/MainActivity;", "onWindowFocusChanged", ("V", ("Z",)))]

    vmethods = sorted([
        (m_main_back, 0x0001, code_onback_off),     # ACC_PUBLIC
        (m_main_create, 0x0004, code_oncreate_off), # ACC_PROTECTED
        (m_main_focus, 0x0001, code_onfocus_off),   # ACC_PUBLIC
    ], key=lambda x: x[0])

    class_data_off = len(buf)
    buf.extend(uleb128(0))  # static_fields_size
    buf.extend(uleb128(1))  # instance_fields_size
    buf.extend(uleb128(1))  # direct_methods_size
    buf.extend(uleb128(len(vmethods)))  # virtual_methods_size

    # Instance field: webView (ACC_PRIVATE = 0x0002)
    buf.extend(uleb128(f_webview))
    buf.extend(uleb128(0x0002))

    # Direct method: <init> (ACC_PUBLIC | ACC_CONSTRUCTOR = 0x10001)
    buf.extend(uleb128(m_main_init))
    buf.extend(uleb128(0x10001))
    buf.extend(uleb128(code_init_off))

    # Virtual methods (delta-encoded method_idx)
    prev_m = 0
    for mid, acc, coff in vmethods:
        buf.extend(uleb128(mid - prev_m))
        buf.extend(uleb128(acc))
        buf.extend(uleb128(coff))
        prev_m = mid

    # Patch single class_def_item
    struct.pack_into(
        "<IIIIIIII",
        buf,
        class_defs_off,
        t_idx["Lcom/periodictable/arena/MainActivity;"],  # class_idx
        0x0001,                                           # ACC_PUBLIC
        t_idx["Landroid/app/Activity;"],                  # superclass_idx
        0,                                                # interfaces_off
        0xFFFFFFFF,                                       # source_file_idx
        0,                                                # annotations_off
        class_data_off,                                   # class_data_off
        0,                                                # static_values_off
    )

    # Emit mandatory DEX map_list at end of data section
    align4()
    map_off = len(buf)
    map_entries = [
        (0x0000, 1, 0),
        (0x0001, len(strings), string_ids_off),
        (0x0002, len(type_descs), type_ids_off),
        (0x0003, len(protos), proto_ids_off),
        (0x0004, len(fields), field_ids_off),
        (0x0005, len(methods), method_ids_off),
        (0x0006, 1, class_defs_off),
        (0x1001, len(unique_param_tuples), min(type_list_offsets.values())),
        (0x2001, 1 + len(vmethods), code_init_off),
        (0x2002, len(strings), string_data_off),
        (0x2000, 1, class_data_off),
        (0x1000, 1, map_off),
    ]
    map_entries.sort(key=lambda item: item[2])

    buf.extend(struct.pack("<I", len(map_entries)))
    for m_type, m_size, m_offset in map_entries:
        buf.extend(struct.pack("<HHII", m_type, 0, m_size, m_offset))

    align4()
    file_size = len(buf)
    data_size = file_size - data_off

    # Fill 112-byte DEX header
    buf[0:8] = b"dex\n035\x00"
    struct.pack_into(
        "<IIIIIIIIIIIIIIIIIIII",
        buf,
        32,
        file_size,
        0x70,
        0x12345678,
        0,
        0,
        map_off,
        len(strings), string_ids_off,
        len(type_descs), type_ids_off,
        len(protos), proto_ids_off,
        len(fields), field_ids_off,
        len(methods), method_ids_off,
        1, class_defs_off,
        data_size, data_off,
    )

    # Compute SHA-1 over bytes [32..end], then Adler32 over bytes [12..end]
    buf[12:32] = hashlib.sha1(buf[32:]).digest()
    struct.pack_into("<I", buf, 8, zlib.adler32(buf[12:]) & 0xFFFFFFFF)
    return bytes(buf)


# ============================================================================
# 5. ZipAlign (4-Byte Uncompressed Alignment) + JAR v1 & APK Signature Scheme v2
# ============================================================================

def generate_signing_identity():
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, "Periodic Table Arena Dev"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Periodic Table Lab"),
        x509.NameAttribute(NameOID.COUNTRY_NAME, "IN"),
    ])
    now = datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now)
        .not_valid_after(now + datetime.timedelta(days=365 * 25))
        .sign(key, hashes.SHA256())
    )
    return key, cert


def write_aligned_zip(entries):
    """
    entries: list of (arcname, raw_bytes, compress_bool)
    Ensures every STORED entry's raw data begins at an exact multiple of 4 bytes (zipalign -f 4)!
    """
    mem = io.BytesIO()
    with zipfile.ZipFile(mem, "w") as zf:
        for name, data, compress in entries:
            zi = zipfile.ZipInfo(filename=name, date_time=(2026, 10, 20, 12, 0, 0))
            zi.create_system = 3
            zi.external_attr = 0o644 << 16
            if not compress:
                zi.compress_type = zipfile.ZIP_STORED
                # Local file header is 30 + len(filename) + len(extra) bytes
                base_data_offset = mem.tell() + 30 + len(name.encode("utf-8"))
                pad = (4 - (base_data_offset % 4)) % 4
                if pad:
                    zi.extra = b"\x00" * pad
            else:
                zi.compress_type = zipfile.ZIP_DEFLATED
            zf.writestr(zi, data)
    return mem.getvalue()


def compute_apk_v2_digest_chunked(sections, priv_key, cert):
    """
    Implements official Android APK Signature Scheme v2 (ID 0x7109871a, RSA-PKCS1-v1_5 SHA-256 = 0x0103).
    """
    CHUNK_SIZE = 1024 * 1024  # 1 MiB
    chunk_digests = []
    for section in sections:
        pos = 0
        n = len(section)
        while pos < n:
            part = section[pos : pos + CHUNK_SIZE]
            h = hashlib.sha256(b"\xa5" + struct.pack("<I", len(part)) + part).digest()
            chunk_digests.append(h)
            pos += CHUNK_SIZE

    top_level_digest = hashlib.sha256(
        b"\x5a" + struct.pack("<I", len(chunk_digests)) + b"".join(chunk_digests)
    ).digest()

    def lp_bytes(b):
        return struct.pack("<I", len(b)) + b

    ALGO_RSA_PKCS1_SHA256 = 0x0103
    digest_entry = lp_bytes(struct.pack("<I", ALGO_RSA_PKCS1_SHA256) + lp_bytes(top_level_digest))
    digests_seq = lp_bytes(digest_entry)

    cert_der = cert.public_bytes(serialization.Encoding.DER)
    certs_seq = lp_bytes(lp_bytes(cert_der))
    additional_attrs = lp_bytes(b"")

    signed_data_bytes = digests_seq + certs_seq + additional_attrs
    raw_sig = priv_key.sign(signed_data_bytes, padding.PKCS1v15(), hashes.SHA256())

    sig_entry = lp_bytes(struct.pack("<I", ALGO_RSA_PKCS1_SHA256) + lp_bytes(raw_sig))
    signatures_seq = lp_bytes(sig_entry)
    pub_key_spki = cert.public_key().public_bytes(
        serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo
    )

    signer_bytes = lp_bytes(signed_data_bytes) + signatures_seq + lp_bytes(pub_key_spki)
    v2_value = lp_bytes(lp_bytes(signer_bytes))

    pair_body = struct.pack("<I", 0x7109871A) + v2_value
    pairs = struct.pack("<Q", len(pair_body)) + pair_body

    # Total block size excluding first 8-byte size field: len(pairs) + 8 (second size) + 16 ("APK Sig Block 42")
    size_of_block = len(pairs) + 24
    return (
        struct.pack("<Q", size_of_block)
        + pairs
        + struct.pack("<Q", size_of_block)
        + b"APK Sig Block 42"
    )


def inject_apk_v2_signature(zip_bytes, priv_key, cert):
    # Locate End of Central Directory (EOCD: PK\x05\x06)
    eocd_pos = zip_bytes.rfind(b"PK\x05\x06")
    if eocd_pos < 0:
        raise RuntimeError("Invalid ZIP: EOCD not found")

    cd_size = struct.unpack_from("<I", zip_bytes, eocd_pos + 12)[0]
    cd_offset = struct.unpack_from("<I", zip_bytes, eocd_pos + 16)[0]

    before_cd = zip_bytes[:cd_offset]
    cd_bytes = zip_bytes[cd_offset:eocd_pos]
    eocd_bytes = bytearray(zip_bytes[eocd_pos:])

    # Per Android V2 spec, EOCD's CD offset points to the start of the APK Signing Block during digest calculation:
    struct.pack_into("<I", eocd_bytes, 16, cd_offset)
    sig_block = compute_apk_v2_digest_chunked([before_cd, cd_bytes, bytes(eocd_bytes)], priv_key, cert)

    # Update EOCD's CD offset to actual new Central Directory offset after inserting sig_block!
    new_cd_offset = cd_offset + len(sig_block)
    struct.pack_into("<I", eocd_bytes, 16, new_cd_offset)
    return before_cd + sig_block + cd_bytes + bytes(eocd_bytes)


def build_apk(output_path):
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    priv_key, cert = generate_signing_identity()

    raw_files = [
        ("AndroidManifest.xml", build_binary_axml(), True),
        ("resources.arsc", build_resources_arsc(), False),  # MUST BE UNCOMPRESSED & 4-BYTE ALIGNED!
        ("res/drawable/icon.png", open(os.path.join(root, "icons/icon-192.png"), "rb").read(), False),
        ("classes.dex", build_classes_dex(), True),
    ]

    web_assets = [
        "index.html",
        "manifest.webmanifest",
        "css/style.css",
        "js/elements-data.js",
        "js/mnemonics-data.js",
        "js/sound.js",
        "js/app.js",
        "icons/icon.svg",
        "icons/icon-192.png",
        "icons/icon-512.png",
    ]
    for rel in web_assets:
        full = os.path.join(root, rel)
        is_png = rel.endswith(".png")
        raw_files.append((f"assets/www/{rel}", open(full, "rb").read(), not is_png))

    # Build JAR v1 Signature (META-INF/MANIFEST.MF, CERT.SF, CERT.RSA)
    mf_lines = ["Manifest-Version: 1.0", "Created-By: PeriodicTableArena 1.0", ""]
    sf_entries = []
    for arcname, content, _ in raw_files:
        digest_b64 = base64.b64encode(hashlib.sha256(content).digest()).decode("ascii")
        section = f"Name: {arcname}\r\nSHA-256-Digest: {digest_b64}\r\n\r\n"
        mf_lines.append(section)
        sec_digest = base64.b64encode(hashlib.sha256(section.encode("utf-8")).digest()).decode("ascii")
        sf_entries.append(f"Name: {arcname}\r\nSHA-256-Digest: {sec_digest}\r\n\r\n")

    manifest_mf = ("\r\n".join(mf_lines[:3]) + "".join(mf_lines[3:])).encode("utf-8")
    main_digest = base64.b64encode(hashlib.sha256(manifest_mf).digest()).decode("ascii")
    cert_sf = (
        f"Signature-Version: 1.0\r\nSHA-256-Digest-Manifest: {main_digest}\r\nCreated-By: PeriodicTableArena 1.0\r\n\r\n"
        + "".join(sf_entries)
    ).encode("utf-8")

    cert_rsa = (
        pkcs7.PKCS7SignatureBuilder()
        .set_data(cert_sf)
        .add_signer(cert, priv_key, hashes.SHA256())
        .sign(serialization.Encoding.DER, [pkcs7.PKCS7Options.DetachedSignature])
    )

    all_entries = raw_files + [
        ("META-INF/MANIFEST.MF", manifest_mf, True),
        ("META-INF/CERT.SF", cert_sf, True),
        ("META-INF/CERT.RSA", cert_rsa, True),
    ]

    aligned_zip = write_aligned_zip(all_entries)
    signed_apk = inject_apk_v2_signature(aligned_zip, priv_key, cert)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(signed_apk)
    print(f"Built signed Android APK: {output_path} ({len(signed_apk):,} bytes)")


if __name__ == "__main__":
    out_apk = os.path.join(os.path.dirname(__file__), "..", "download", "Periodic-Table-Arena.apk")
    build_apk(os.path.abspath(out_apk))
