import sqlparse

DISALLOWED = {"drop","delete","insert","update","create","alter","truncate"}

def is_safe_select(sql: str) -> bool:
    parsed = sqlparse.format(sql, strip_comments=True).strip().lower()
    # Must contain select and not start with disallowed keywords
    if "select" not in parsed:
        return False
    for banned in DISALLOWED:
        if banned in parsed.split():
            return False
    # Enforce a default LIMIT (optional - caller should add)
    return True
