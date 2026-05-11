"""
Training script for deal health / lead scoring models.
Exports features from CRM database, trains XGBoost model, exports to ONNX.

Usage:
  python scripts/train-scoring-model.py --model-type deal_health --workspace-id <uuid>

Requirements:
  pip install xgboost scikit-learn onnx skl2onnx psycopg2-binary
"""
import argparse
import sys

def main():
    parser = argparse.ArgumentParser(description="Train CRM scoring model")
    parser.add_argument("--model-type", choices=["deal_health", "lead_score"], required=True)
    parser.add_argument("--workspace-id", required=True)
    parser.add_argument("--output", default="model.onnx")
    args = parser.parse_args()

    print(f"Training {args.model_type} model for workspace {args.workspace_id}")
    print("TODO: Implement feature export, training, and ONNX export")
    sys.exit(0)

if __name__ == "__main__":
    main()
