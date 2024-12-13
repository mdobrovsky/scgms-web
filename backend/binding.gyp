{
  "targets": [
    {
      "target_name": "scgms_wrapper",
      "sources": ["../scgms_wrappers/scgms_wrapper.cpp"],
      "include_dirs": [
        "../scgms-release/common/scgms/rtl",
        "<!(node -p \"require('node-addon-api').targets\"):node_addon_api",
      ],
      "defines": [
        "NODE_ADDON_API_DISABLE_CPP_EXCEPTIONS"
      ],
      "cflags": [
        "-std=c++17",
      ],
      "cflags_cc": [
        "-std=c++17",
      ],
      "ldflags": [
        "-L../scgms-release/build",
        "-lscgms",
        "-Wl,-rpath,../scgms-release/build/compiled",
      ],
      "libraries": [
        "-lc++"
      ],
      'conditions': [
        ['OS=="mac"', {
            'cflags+': ['-fvisibility=hidden'],
            'xcode_settings': {
              'GCC_SYMBOLS_PRIVATE_EXTERN': 'YES', # -fvisibility=hidden
            }
        }]
      ]
    }
  ]
}
