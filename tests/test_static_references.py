import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parents[1]


class StaticReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        for attribute in ("href", "src"):
            value = attributes.get(attribute)
            if value:
                self.references.append((tag, attribute, value))


def iter_local_references(html_file):
    parser = StaticReferenceParser()
    parser.feed(html_file.read_text(encoding="utf-8"))

    for tag, attribute, value in parser.references:
        parsed = urlparse(value)
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue

        reference_path = unquote(parsed.path)
        if reference_path.startswith("#"):
            continue

        yield tag, attribute, value, (html_file.parent / reference_path).resolve()


class StaticReferenceTests(unittest.TestCase):
    def test_top_level_html_references_existing_local_files(self):
        failures = []

        for html_file in sorted(ROOT.glob("*.html")):
            for tag, attribute, value, resolved_path in iter_local_references(html_file):
                try:
                    resolved_path.relative_to(ROOT)
                except ValueError:
                    failures.append(f"{html_file.name}: {tag}[{attribute}] escapes repo: {value}")
                    continue

                if not resolved_path.exists():
                    failures.append(f"{html_file.name}: {tag}[{attribute}] missing file: {value}")

        self.assertEqual([], failures)


if __name__ == "__main__":
    unittest.main()
