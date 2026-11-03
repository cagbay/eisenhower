"""Ersatz für imagecodecs im Browser: LZW über JavaScript (wvzLzwDecode), übrige Codecs aus tifffile._imagecodecs."""
import importlib.util as _u, os as _os, sysconfig as _sc
_p = _os.path.join(_sc.get_paths()["purelib"], "tifffile", "_imagecodecs.py")
_s = _u.spec_from_file_location("_wvz_tif_codecs", _p); _m = _u.module_from_spec(_s); _s.loader.exec_module(_m)
globals().update({k: v for k, v in vars(_m).items() if not k.startswith("__")})
__version__ = "2026.8.16"

def lzw_decode(data, /, *, out=None):
    import js
    from pyodide.ffi import to_js
    return js.wvzLzwDecode(to_js(bytes(data))).to_bytes()
