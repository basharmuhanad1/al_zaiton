from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import unittest


ROOT = Path(__file__).resolve().parents[1]


class LocalReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for attr in ("href", "src"):
            if attr in attrs:
                self.references.append((tag, attr, attrs[attr]))


def is_local_file_reference(reference):
    parsed = urlparse(reference)
    return not parsed.scheme and not parsed.netloc and not reference.startswith("#")


class StaticLinkTests(unittest.TestCase):
    def test_html_local_references_exist(self):
        missing = []

        for html_file in sorted(ROOT.glob("*.html")):
            parser = LocalReferenceParser()
            parser.feed(html_file.read_text(encoding="utf-8"))

            for tag, attr, reference in parser.references:
                if not is_local_file_reference(reference):
                    continue

                target = (html_file.parent / urlparse(reference).path).resolve()
                if ROOT not in target.parents and target != ROOT:
                    missing.append(f"{html_file.name}: {tag}[{attr}] escapes site root: {reference}")
                elif not target.exists():
                    missing.append(f"{html_file.name}: {tag}[{attr}] missing: {reference}")

        self.assertEqual([], missing)


if __name__ == "__main__":
    unittest.main()
