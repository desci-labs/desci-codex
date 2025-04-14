import { MODEL_STREAM_ID } from "@ceramic-sdk/model-protocol";

const RESEARCH_OBJECT =
  "kjzl6hvfrbw6cbe01it6hlcwopsv4cqrqysho4f1xd7rtqxew9yag3x2wxczhz0";

const RESEARCH_OBJECT_SCHEMA = {
  "accountRelation": {
    "type": "list"
  },
  "description": "A research object",
  "immutableFields": [],
  "implements": [],
  "interface": false,
  "name": "ResearchObject",
  "relations": {},
  "schema": {
    "$defs": {
      "InterPlanetaryCID": {
        "maxLength": 100,
        "title": "InterPlanetaryCID",
        "type": "string"
      }
    },
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "additionalProperties": false,
    "properties": {
      "license": {
        "maxLength": 100,
        "type": "string"
      },
      "manifest": {
        "$ref": "#/$defs/InterPlanetaryCID"
      },
      "metadata": {
        "$ref": "#/$defs/InterPlanetaryCID"
      },
      "title": {
        "maxLength": 250,
        "type": "string"
      }
    },
    "required": [
      "title",
      "license",
      "manifest"
    ],
    "type": "object"
  },
  "version": "2.0",
  "views": {
    "owner": {
      "type": "documentAccount"
    },
    "version": {
      "type": "documentVersion"
    }
  }
}

export const MODEL_IDS = {
  /** The model for model streams, a protocol constant */
  meta: MODEL_STREAM_ID,
  researchObject: RESEARCH_OBJECT,
};
