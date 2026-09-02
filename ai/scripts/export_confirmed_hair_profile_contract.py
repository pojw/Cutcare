import json
import sys
from pathlib import Path


AI_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = AI_ROOT.parent
sys.path.append(str(AI_ROOT))

from app.models.confirmed_hair_profile import ConfirmedHairProfile


def main() -> None:
    contract_path = (
        REPO_ROOT
        / "frontend"
        / "src"
        / "contracts"
        / "confirmedHairProfileContract.js"
    )
    contract_path.parent.mkdir(parents=True, exist_ok=True)

    schema = ConfirmedHairProfile.model_json_schema()
    profile_fields = ConfirmedHairProfile.PROFILE_CONTEXT_FIELDS
    retrieval_fields = ConfirmedHairProfile.RETRIEVAL_QUERY_FIELDS

    contract_source = f"""// Generated from ai/app/models/confirmed_hair_profile.py.
// Run `cd ai && ../ai/venv/bin/python scripts/export_confirmed_hair_profile_contract.py` after changing the model.

export const CONFIRMED_HAIR_PROFILE_FIELDS = {json.dumps(profile_fields, indent=2)};

export const CONFIRMED_HAIR_PROFILE_RETRIEVAL_FIELDS = {json.dumps(retrieval_fields, indent=2)};

export const CONFIRMED_HAIR_PROFILE_SCHEMA = {json.dumps(schema, indent=2)};
"""

    contract_path.write_text(contract_source, encoding="utf-8")

    print(f"Exported confirmed hair profile contract to {contract_path}")


if __name__ == "__main__":
    main()
