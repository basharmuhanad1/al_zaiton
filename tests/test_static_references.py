import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]


class LocalReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in {"href", "src"} and value:
                self.references.append(value)


def is_local_reference(reference):
    parsed = urlparse(reference)
    return not parsed.scheme and not parsed.netloc and not reference.startswith("#")


class StaticReferenceTests(unittest.TestCase):
    def test_html_local_references_exist(self):
        missing = []

        for html_file in ROOT.glob("*.html"):
            parser = LocalReferenceParser()
            parser.feed(html_file.read_text(encoding="utf-8"))

            for reference in parser.references:
                if not is_local_reference(reference):
                    continue

                path = urlparse(reference).path
                if path.startswith("/"):
                    target = ROOT / path.lstrip("/")
                else:
                    target = html_file.parent / path

                if not target.exists():
                    missing.append(f"{html_file.name}: {reference}")

        self.assertEqual([], missing)

    def test_product_page_has_no_placeholder_images(self):
        content = (ROOT / "products.html").read_text(encoding="utf-8")

        self.assertNotIn("path_to_image", content)


if __name__ == "__main__":
    unittest.main()
