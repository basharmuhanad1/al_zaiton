from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse
import unittest


ROOT = Path(__file__).resolve().parents[1]


class ReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in {"href", "src"} and value:
                self.references.append((tag, name, value))


def local_path(reference):
    parsed = urlparse(reference)
    if parsed.scheme or parsed.netloc or parsed.path.startswith("#"):
        return None
    return Path(unquote(parsed.path))


class StaticReferenceTests(unittest.TestCase):
    def test_local_html_references_exist(self):
        missing = []

        for html_file in sorted(ROOT.glob("*.html")):
            parser = ReferenceParser()
            parser.feed(html_file.read_text(encoding="utf-8"))

            for tag, attr, reference in parser.references:
                path = local_path(reference)
                if path is None:
                    continue

                target = (html_file.parent / path).resolve()
                try:
                    target.relative_to(ROOT)
                except ValueError:
                    missing.append(f"{html_file.name}: {tag} {attr} escapes root: {reference}")
                    continue

                if not target.exists():
                    missing.append(f"{html_file.name}: {tag} {attr} missing: {reference}")

        self.assertEqual([], missing)


if __name__ == "__main__":
    unittest.main()
