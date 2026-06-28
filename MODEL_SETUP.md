# Using Your TensorFlow.js Model

## Quick Setup

### 1. Place Your Model Files in `public/model/`

```
public/
└── model/
    ├── model.json          # TensorFlow.js model file
    ├── group1-shard1of1.bin # Model weights (auto-generated)
    └── word_to_idx.json    # Your vocabulary mapping
```

### 2. Create `word_to_idx.json`

This maps your ASL words to model output indices:

```json
{
  "hello": 0,
  "thanks": 1,
  "please": 2,
  "help": 3,
  "sorry": 4,
  "yes": 5,
  "no": 6,
  "love": 7,
  "friend": 8,
  "family": 9
}
```

### 3. Converting Your .h5 Model to TensorFlow.js

You've already converted the model! But for reference:

```bash
# Install tensorflowjs converter
pip install tensorflowjs

# Convert Keras .h5 model
tensorflowjs_converter --input_format=keras \
    alpha.keras \
    public/model/

# Or from .h5 file
tensorflowjs_converter --input_format=keras \
    model.h5 \
    public/model/
```

This creates:
- `model.json` - Model architecture
- `group1-shard1of1.bin` (or multiple shards) - Model weights

### 4. Run the App

```bash
# Build the frontend
npm run build

# Serve with any static server
npx serve dist

# Or use Flask backend
cd backend && python app.py
```

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐    │
│   │   Camera    │───▶│  MediaPipe  │───▶│  Extract 126    │    │
│   │   Feed      │    │  Hands      │    │  landmarks/frame│    │
│   └─────────────┘    └─────────────┘    └────────┬────────┘    │
│                                                   │             │
│                                                   ▼             │
│                                          ┌───────────────┐      │
│                                          │ Collect 30    │      │
│                                          │ frames        │      │
│                                          └───────┬───────┘      │
│                                                  │              │
│                                                  ▼              │
│   ┌─────────────┐    ┌─────────────┐    ┌───────────────┐      │
│   │  Display    │◀───│  Top 3      │◀───│ TensorFlow.js │      │
│   │  Results    │    │  Predictions│    │ Model.predict │      │
│   └─────────────┘    └─────────────┘    └───────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Model Requirements

Your model should expect input shape: `(batch, 30, 126)`

- **30 frames** - Captured during recording
- **126 features per frame**:
  - 2 hands × 21 landmarks × 3 coordinates (x, y, z)
  - If only 1 hand detected, second hand is zeros

Output should be softmax probabilities for each class.

## Status Indicators

The app shows the model status in the top bar:

| Status | Color | Meaning |
|--------|-------|---------|
| 🟢 **ML (20 signs)** | Green | Model loaded, shows vocabulary size |
| 🟡 **Loading Model...** | Yellow | Model is loading |
| 🔴 **Demo Mode** | Red | Model failed to load, using simulated predictions |

## Troubleshooting

### "Demo Mode" instead of model loading

1. Check browser console for errors
2. Verify files exist at `/model/model.json`
3. Ensure `word_to_idx.json` is valid JSON

### Wrong predictions

1. Verify your model expects `(batch, 30, 126)` input
2. Check `word_to_idx.json` matches your training labels
3. Model may need more training data

### Model too large

TensorFlow.js models can be split into shards. The converter does this automatically for large models. All shard files must be in the same directory as `model.json`.

## Example Directory Structure

```
your-project/
├── public/
│   └── model/
│       ├── model.json              # ← TensorFlow.js model
│       ├── group1-shard1of1.bin    # ← Model weights
│       └── word_to_idx.json        # ← Vocabulary mapping
├── src/
│   └── hooks/
│       └── useMLModel.ts           # ← Loads and runs model
├── backend/
│   └── app.py                      # ← Optional Flask backend
└── package.json
```

## Testing Your Model

Open browser console and check for:

```
✅ Loaded vocabulary: ["hello", "thanks", "please", ...]
🔄 Loading TensorFlow.js model from: /model/model.json
✅ Loaded as LayersModel
📊 Model info: {inputShape: [null, 30, 126], outputShape: [null, 20], numClasses: 20}
```

When you record a sign:
```
🔮 Predictions: [{word: "hello", confidence: 0.85}, ...]
```
