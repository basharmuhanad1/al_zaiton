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


class StaticReferenceTests(unittest.TestCase):
    def test_local_html_references_resolve_to_files(self):
        html_files = sorted(ROOT.glob("*.html"))
        self.assertTrue(html_files, "expected top-level HTML files to test")

        for html_file in html_files:
            parser = ReferenceParser()
            parser.feed(html_file.read_text(encoding="utf-8"))

            for tag, attr, reference in parser.references:
                parsed = urlparse(reference)
                if parsed.scheme or parsed.netloc:
                    continue

                target_path = unquote(parsed.path)
                if not target_path:
                    continue

                resolved = (html_file.parent / target_path).resolve()
                with self.subTest(file=html_file.name, tag=tag, attr=attr, reference=reference):
                    self.assertTrue(
                        resolved.is_file(),
                        f"{html_file.name} references missing local file: {reference}",
                    )


if __name__ == "__main__":
    unittest.main()
