from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import unittest


REPO_ROOT = Path(__file__).resolve().parents[1]


class StaticReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in {"href", "src"} and value:
                self.references.append(value)


def is_local_reference(reference):
    parsed = urlparse(reference)
    return (
        not parsed.scheme
        and not parsed.netloc
        and not reference.startswith("#")
    )


class StaticReferenceTests(unittest.TestCase):
    def test_local_html_references_resolve(self):
        missing = []

        for page_path in REPO_ROOT.glob("*.html"):
            parser = StaticReferenceParser()
            parser.feed(page_path.read_text(encoding="utf-8"))

            for reference in parser.references:
                if not is_local_reference(reference):
                    continue

                target = (page_path.parent / urlparse(reference).path).resolve()
                try:
                    target.relative_to(REPO_ROOT)
                except ValueError:
                    missing.append(f"{page_path.name}: {reference} escapes repository")
                    continue

                if not target.exists():
                    missing.append(f"{page_path.name}: {reference}")

        self.assertEqual([], missing)
