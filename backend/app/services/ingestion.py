from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass


@dataclass(frozen=True)
class IngestedDocument:
    id: str
    title: str
    source: str
    text: str
    kind: str
    tags: tuple[str, ...]


def normalize_document(title: str, source: str, text: str, kind: str) -> IngestedDocument:
    digest = hashlib.sha1(f"{source}:{title}:{text}".encode("utf-8")).hexdigest()[:12]
    tags = tuple(sorted(set(re.findall(r"[a-zA-Z]{4,}", f"{title} {text}".lower()))))[:12]
    return IngestedDocument(f"doc-{digest}", title.strip(), source.strip(), text.strip(), kind, tags)
