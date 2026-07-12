import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]


class ReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []
        self.images = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a" and "href" in attrs:
            self.references.append(("href", attrs["href"]))
        if tag == "img" and "src" in attrs:
            src = attrs["src"]
            self.references.append(("src", src))
            self.images.append(src)


def is_local_reference(reference):
    parsed = urlparse(reference)
    return not parsed.scheme and not parsed.netloc and not reference.startswith("#")


class StaticReferenceTests(unittest.TestCase):
    def parse_html(self, path):
        parser = ReferenceParser()
        parser.feed(path.read_text(encoding="utf-8"))
        return parser

    def test_local_html_references_exist(self):
        html_files = sorted(ROOT.glob("*.html"))

        for html_file in html_files:
            parser = self.parse_html(html_file)
            for attr, reference in parser.references:
                if not is_local_reference(reference):
                    continue

                target = ROOT / urlparse(reference).path
                with self.subTest(file=html_file.name, attr=attr, reference=reference):
                    self.assertTrue(
                        target.is_file(),
                        f"{html_file.name} references missing file {reference}",
                    )

    def test_products_page_uses_committed_product_images(self):
        parser = self.parse_html(ROOT / "products.html")

        self.assertEqual(
            [f"{index}.jpg" for index in range(1, 9)],
            parser.images,
        )


if __name__ == "__main__":
    unittest.main()
