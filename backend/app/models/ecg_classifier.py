import torch
from torch import nn

class ECGEncoder(nn.Module):
    """
    1D Convolutional feature extractor for 12-lead ECG signals.
    Expects input shape: [batch_size, 12, 1000]
    Outputs latent embedding: [batch_size, latent_dim]
    """
    def __init__(self, latent_dim: int = 128):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv1d(12, 32, kernel_size=7, stride=2, padding=3),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.Conv1d(32, 64, kernel_size=7, stride=2, padding=3),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Conv1d(64, 128, kernel_size=7, stride=2, padding=3),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(8)
        )
        self.fc = nn.Linear(128 * 8, latent_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        h = self.conv(x).flatten(1)
        return self.fc(h)

class ECGClassifier(nn.Module):
    """
    Multi-label classifier head on top of the ECGEncoder backbone.
    Outputs raw logits for the 5 diagnostic superclasses (NORM, MI, STTC, CD, HYP).
    """
    def __init__(self, encoder: ECGEncoder | None = None, latent_dim: int = 128, num_classes: int = 5):
        super().__init__()
        self.encoder = ECGEncoder(latent_dim) if encoder is None else encoder
        self.head = nn.Sequential(
            nn.Linear(latent_dim, 128),
            nn.ReLU(),
            nn.Dropout(0.25),
            nn.Linear(128, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        latent = self.encoder(x)
        return self.head(latent)
