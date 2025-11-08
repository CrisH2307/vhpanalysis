from __future__ import annotations

import threading
from typing import Any, Dict, Optional, Tuple

import numpy as np


class InMemorySessionDataStore:
    def __init__(self) -> None:
        self._data: Dict[str, Dict[str, Dict[str, Any]]] = {}
        self._lock = threading.Lock()

    def store(
        self,
        session_id: str,
        data_type: str,
        data_array: np.ndarray,
        asset_date: str,
        bbox: Tuple[float, float, float, float],
    ) -> None:
        with self._lock:
            self._data.setdefault(session_id, {})[data_type] = {
                "data": np.array(data_array, copy=True),
                "asset_date": asset_date,
                "bbox": bbox,
            }

    def get(self, session_id: str) -> Optional[Dict[str, Dict[str, Any]]]:
        with self._lock:
            session_data = self._data.get(session_id)
            if session_data is None:
                return None
            return {
                key: {
                    "data": np.array(value["data"], copy=True),
                    "asset_date": value["asset_date"],
                    "bbox": value["bbox"],
                }
                for key, value in session_data.items()
            }

    def clear(self) -> None:
        with self._lock:
            self._data.clear()


_store: InMemorySessionDataStore = InMemorySessionDataStore()


def set_session_data_store(store: InMemorySessionDataStore) -> None:
    global _store
    _store = store


def get_session_data_store() -> InMemorySessionDataStore:
    return _store


def store_session_data(
    session_id: Optional[str],
    data_type: str,
    data_array: np.ndarray,
    asset_date: str,
    bbox: Tuple[float, float, float, float],
) -> None:
    if session_id is None:
        return

    _store.store(session_id, data_type, data_array, asset_date, bbox)


def get_session_data(session_id: str) -> Optional[Dict[str, Dict[str, Any]]]:
    return _store.get(session_id)

