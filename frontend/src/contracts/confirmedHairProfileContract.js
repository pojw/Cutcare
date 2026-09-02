// Generated from ai/app/models/confirmed_hair_profile.py.
// Run `cd ai && ../ai/venv/bin/python scripts/export_confirmed_hair_profile_contract.py` after changing the model.

export const CONFIRMED_HAIR_PROFILE_FIELDS = [
  "overallLengthCategory",
  "frontLengthCategory",
  "sideLengthCategory",
  "backLengthCategory",
  "texture",
  "density",
  "hairlineShape",
  "foreheadCoverage",
  "fringeEndLevel",
  "faceShape",
  "fadeOrTaperPresent",
  "fadeHeight",
  "earCoverage",
  "sideburnLength",
  "backBlending",
  "napeCoverage"
];

export const CONFIRMED_HAIR_PROFILE_RETRIEVAL_FIELDS = [
  "overallLengthCategory",
  "frontLengthCategory",
  "sideLengthCategory",
  "backLengthCategory",
  "texture",
  "density",
  "faceShape",
  "fadeOrTaperPresent",
  "fadeHeight"
];

export const CONFIRMED_HAIR_PROFILE_SCHEMA = {
  "additionalProperties": false,
  "properties": {
    "overallLengthCategory": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Overalllengthcategory"
    },
    "frontLengthCategory": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Frontlengthcategory"
    },
    "sideLengthCategory": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Sidelengthcategory"
    },
    "backLengthCategory": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Backlengthcategory"
    },
    "texture": {
      "anyOf": [
        {
          "enum": [
            "straight",
            "wavy",
            "curly",
            "coily",
            "unclear"
          ],
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Texture"
    },
    "density": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Density"
    },
    "hairlineShape": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Hairlineshape"
    },
    "foreheadCoverage": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Foreheadcoverage"
    },
    "fringeEndLevel": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Fringeendlevel"
    },
    "faceShape": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Faceshape"
    },
    "fadeOrTaperPresent": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Fadeortaperpresent"
    },
    "fadeHeight": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Fadeheight"
    },
    "earCoverage": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Earcoverage"
    },
    "sideburnLength": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Sideburnlength"
    },
    "backBlending": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Backblending"
    },
    "napeCoverage": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Napecoverage"
    }
  },
  "title": "ConfirmedHairProfile",
  "type": "object"
};
