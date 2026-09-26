from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import unittest


ROOT = Path(__file__).resolve().parents[1]


class StaticReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for attribute in ("href", "src"):
            value = attrs.get(attribute)
            if value:
                self.references.append((tag, attribute, value))


def html_files():
    return sorted(ROOT.glob("*.html"))


def is_local_reference(value):
    parsed = urlparse(value)
    return not parsed.scheme and not parsed.netloc and not value.startswith("#")


class StaticReferenceTests(unittest.TestCase):
    def test_local_html_references_exist(self):
        for html_file in html_files():
            parser = StaticReferenceParser()
            parser.feed(html_file.read_text(encoding="utf-8"))

            for tag, attribute, value in parser.references:
                if not is_local_reference(value):
                    continue

                with self.subTest(
                    file=html_file.name,
                    tag=tag,
                    attribute=attribute,
                    value=value,
                ):
                    target = (html_file.parent / urlparse(value).path).resolve()
                    self.assertTrue(
                        target.is_relative_to(ROOT),
                        f"{value} referenced by {html_file.name} escapes the repo",
                    )
                    self.assertTrue(
                        target.is_file(),
                        f"{value} referenced by {html_file.name} is missing",
                    )

    def test_products_page_uses_committed_product_images(self):
        parser = StaticReferenceParser()
        parser.feed((ROOT / "products.html").read_text(encoding="utf-8"))

        product_images = [
            value
            for tag, attribute, value in parser.references
            if tag == "img" and attribute == "src"
        ]

        self.assertEqual([f"{index}.jpg" for index in range(1, 9)], product_images)
