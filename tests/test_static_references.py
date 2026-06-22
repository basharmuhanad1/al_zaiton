from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import unittest


ROOT = Path(__file__).resolve().parents[1]


class ReferenceParser(HTMLParser):
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
        and not reference.startswith("/")
    )


class StaticReferenceTests(unittest.TestCase):
    def test_local_html_references_resolve(self):
        for html_file in ROOT.glob("*.html"):
            parser = ReferenceParser()
            parser.feed(html_file.read_text(encoding="utf-8"))

            with self.subTest(page=html_file.name):
                for reference in parser.references:
                    if not is_local_reference(reference):
                        continue

                    target = (html_file.parent / urlparse(reference).path).resolve()
                    self.assertTrue(
                        target.is_relative_to(ROOT),
                        f"{html_file.name} points outside repo: {reference}",
                    )
                    self.assertTrue(
                        target.exists(),
                        f"{html_file.name} points to missing file: {reference}",
                    )


if __name__ == "__main__":
    unittest.main()
