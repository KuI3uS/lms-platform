#!/usr/bin/env python3
"""Check staged-file scanning using synthetic credentials in a temporary repo."""
import os
from pathlib import Path
import secrets
import shutil
import string
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent.parent
SCANNER = ROOT / ".tools" / "gitleaks"
CONFIG = ROOT / ".gitleaks.toml"
HOOK = ROOT / ".githooks" / "pre-commit"


def check(text, should_block, filename="application.properties", secret=None):
    with tempfile.TemporaryDirectory(prefix="lms-secret-test-") as directory:
        repo = Path(directory)
        subprocess.run(["git", "init", "--quiet", str(repo)], check=True)
        (repo / ".tools").mkdir()
        os.symlink(SCANNER, repo / ".tools" / "gitleaks")
        shutil.copyfile(CONFIG, repo / ".gitleaks.toml")
        path = repo / filename
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)
        subprocess.run(["git", "add", "--", filename], cwd=repo, check=True)
        result = subprocess.run(["sh", str(HOOK)], cwd=repo, capture_output=True)
        expected = 1 if should_block else 0
        assert result.returncode == expected, "Unexpected scan result"
        if secret:
            assert secret.encode() not in result.stdout + result.stderr, "Secret was not redacted"


def main():
    assert SCANNER.is_file(), "Install Gitleaks before running these checks"
    value = "".join(secrets.choice(string.ascii_lowercase) for _ in range(16))
    mail_key = ".".join(("spring", "mail", "password"))
    mail_env = "_".join(("MAIL", "PASSWORD"))
    smtp_env = "_".join(("SMTP", "PASSWORD"))
    cases = [
        (mail_key + "=" + value + "\n", True),
        (mail_env + '="' + value + '"\n', True),
        (smtp_env + "=" + value + "\n", True),
        (mail_key + "=${" + mail_env + ":" + value + "}\n", True),
        (mail_key + "=${" + mail_env + "}\n", False),
        (mail_key + "=${" + mail_env + ":}\n", False),
        (mail_key + "=\n", False),
        (mail_key + "=...\n", False),
        (mail_key + "=test\n", True),
    ]
    for text, should_block in cases:
        check(text, should_block, secret=value)
    check(mail_key + "=test\n", False,
          "lms-inf-platform/src/test/resources/application.properties")
    token = "ghp_" + "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(36))
    check("token=" + token + "\n", True, "config.txt", token)
    print("11 secret protection checks passed; fixture values stayed redacted.")


if __name__ == "__main__":
    main()
