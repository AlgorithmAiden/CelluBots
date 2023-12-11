export default {
    "iron": {
        "mode": "shapeless",
        "ingredients": [
            "coal",
            "iron_ore"
        ]
    },
    "copper": {
        "mode": "shapeless",
        "ingredients": [
            "coal",
            "copper_ore"
        ]
    },
    "lead": {
        "mode": "shapeless",
        "ingredients": [
            "coal",
            "lead_ore"
        ]
    },
    "gear": {
        "mode": "shaped",
        "shape": [
            [
                0,
                "iron",
                0
            ],
            [
                "iron",
                0,
                "iron"
            ],
            [
                0,
                "iron",
                0
            ]
        ]
    },
    "iron_spool": {
        "mode": "shaped",
        "shape": [
            [
                0,
                0,
                0
            ],
            [
                0,
                "iron",
                0
            ],
            [
                0,
                0,
                0
            ]
        ]
    },
    "copper_wire": {
        "mode": "shaped",
        "shape": [
            [
                0,
                "copper",
                0
            ],
            [
                "copper",
                "iron_spool",
                "copper"
            ],
            [
                0,
                "copper",
                0
            ]
        ]
    },
    "iron_plate": {
        "mode": "shaped",
        "shape": [
            [
                0,
                0,
                0
            ],
            [
                0,
                0,
                0
            ],
            [
                "iron",
                "iron",
                "iron"
            ]
        ]
    },
    "solder": {
        "mode": "shapeless",
        "ingredients": [
            "lead",
            "coal"
        ]
    },
    "circuit": {
        "mode": "shaped",
        "shape": [
            [
                0,
                "solder",
                0
            ],
            [
                0,
                "copper_wire",
                0
            ],
            [
                0,
                "iron_plate",
                0
            ]
        ]
    },
    "bot_heart": {
        "mode": "shaped",
        "shape": [
            [
                "solder",
                "circuit",
                "copper_wire"
            ],
            [
                "circuit",
                "iron",
                "circuit"
            ],
            [
                "copper_wire",
                "circuit",
                "solder"
            ]
        ]
    },
    "bot": {
        "mode": "shaped",
        "shape": [
            [
                "iron_plate",
                "iron_plate",
                "iron_plate"
            ],
            [
                "iron_plate",
                "bot_heart",
                "iron_plate"
            ],
            [
                "gear",
                "gear",
                "gear"
            ]
        ]
    }
}