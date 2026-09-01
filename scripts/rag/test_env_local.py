import unittest
import os
from pathlib import Path
import tempfile

from env_local import load_env_file


class LoadEnvFileTest(unittest.TestCase):
    def test_loads_key_value_lines_without_overriding_existing(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / ".env.local"
            path.write_text(
                "# comment\n"
                "ZILLIZ_TOKEN=from-file\n"
                'ZILLIZ_URI="https://example.zilliz.com"\n'
                "export ZILLIZ_COLLECTION=listings\n"
                "\n",
                encoding="utf-8",
            )
            env = {"ZILLIZ_TOKEN": "already-set"}
            loaded = load_env_file(path, env)
            self.assertEqual(env["ZILLIZ_TOKEN"], "already-set")
            self.assertEqual(env["ZILLIZ_URI"], "https://example.zilliz.com")
            self.assertEqual(env["ZILLIZ_COLLECTION"], "listings")
            self.assertEqual(loaded["ZILLIZ_URI"], "https://example.zilliz.com")
            self.assertNotIn("ZILLIZ_TOKEN", loaded)

    def test_missing_file_is_a_no_op(self):
        env = {}
        loaded = load_env_file(Path("/tmp/does-not-exist-env-local-xyz"), env)
        self.assertEqual(loaded, {})
        self.assertEqual(env, {})


if __name__ == "__main__":
    unittest.main()
