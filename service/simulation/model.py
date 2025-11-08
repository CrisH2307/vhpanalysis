import pickle
from pathlib import Path
from typing import List, Dict, Any

import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models

def build_unet(input_shape=(128, 128, 1)):
    inputs = layers.Input(shape=input_shape)

    # Encoder
    c1 = layers.Conv2D(32, 3, activation='relu', padding='same')(inputs)
    c1 = layers.Conv2D(32, 3, activation='relu', padding='same')(c1)
    p1 = layers.MaxPooling2D((2, 2))(c1)

    c2 = layers.Conv2D(64, 3, activation='relu', padding='same')(p1)
    c2 = layers.Conv2D(64, 3, activation='relu', padding='same')(c2)
    p2 = layers.MaxPooling2D((2, 2))(c2)

    c3 = layers.Conv2D(128, 3, activation='relu', padding='same')(p2)
    c3 = layers.Conv2D(128, 3, activation='relu', padding='same')(c3)

    # Bottleneck
    b = layers.Conv2D(256, 3, activation='relu', padding='same')(c3)

    # Decoder
    u2 = layers.UpSampling2D((2, 2))(b)
    u2 = layers.concatenate([u2, c2])
    c4 = layers.Conv2D(128, 3, activation='relu', padding='same')(u2)

    u1 = layers.UpSampling2D((2, 2))(c4)
    u1 = layers.concatenate([u1, c1])
    c5 = layers.Conv2D(64, 3, activation='relu', padding='same')(u1)

    outputs = layers.Conv2D(1, 1, activation='linear', padding='same')(c5)

    model = models.Model(inputs, outputs)
    return model

def load_samples(path: Path):
    with path.open("rb") as f:
        samples = pickle.load(f)
    return samples


def to_tensor(samples: List[Dict[str, Any]], key: str) -> np.ndarray:
    arrays = []
    for idx, sample in enumerate(samples):
        arr = np.asarray(sample[key], dtype=np.float32)
        if arr.ndim != 2:
            raise ValueError(f"Sample {idx} key '{key}' expected 2D array, got shape {arr.shape}")
        arr = np.nan_to_num(arr, nan=0.0)
        if arr.shape == (128, 128):
            arrays.append(arr)

    stacked = np.stack(arrays, axis=0)
    stacked = stacked[..., np.newaxis]
    return stacked


def describe_split(name: str, tensors: np.ndarray) -> None:
    print(
        f"{name}: shape={tensors.shape}, "
        f"min={np.min(tensors):.4f}, max={np.max(tensors):.4f}, "
        f"mean={np.mean(tensors):.4f}, std={np.std(tensors):.4f}"
    )

def main() -> None:
    default_path = Path(__file__).resolve().parent / "data" / "data_samples.pkl"
    checkpoint_path = Path(__file__).resolve().parent / "checkpoints"
    samples_path = default_path

    if not samples_path.exists():
        raise FileNotFoundError(f"Samples file not found at {samples_path}")

    samples = load_samples(samples_path)

    if not samples:
        raise ValueError("No samples found in the provided file.")

    # Compile model
    model = build_unet()
    model.compile(optimizer=tf.keras.optimizers.Adam(1e-4),
                loss='mse',
                metrics=[tf.keras.metrics.MeanAbsoluteError()])

    # Prepare data
    print("Data loaded (items: {})".format(len(samples)))
    print("Sample items: {}".format(samples[2445].keys()))
    
    total_samples = len(samples)
    train_set = samples[:int(total_samples * 0.8)]
    test_set = samples[int(total_samples * 0.8):]

    train_x = to_tensor(train_set, "ndvi_delta")
    train_y = to_tensor(train_set, "lst_delta")
    test_x = to_tensor(test_set, "ndvi_delta")
    test_y = to_tensor(test_set, "lst_delta")

    # Clip values
    train_x = np.clip(train_x, -2.0, 2.0)
    train_y = np.clip(train_y, -10.0, 10.0)
    test_x = np.clip(test_x, -2.0, 2.0)
    test_y = np.clip(test_y, -10.0, 10.0)

    describe_split("train_x", train_x)
    describe_split("train_y", train_y)
    describe_split("test_x", test_x)
    describe_split("test_y", test_y)

    history = model.fit(
        train_x,
        train_y,
        epochs=50,
        batch_size=4,
        validation_data=(test_x, test_y),
        verbose=1,
        callbacks=[
            tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=5, min_lr=1e-6),
            tf.keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
            tf.keras.callbacks.ModelCheckpoint(
                filepath=checkpoint_path / "epoch_{epoch:02d}.weights.h5",
                save_best_only=True,
                save_weights_only=True,
                save_freq="epoch"
            )
        ]
    )

    # Save keras model weights
    model.save_weights("model_weights.h5")


if __name__ == "__main__":
    main()