import os

ROOT_DIR = "."        # change if needed
LINE_LIMIT = 500
IGNORE_DIRS = {"node_modules", ".output"}

def count_lines(filepath):
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            return sum(1 for _ in f)
    except Exception:
        return 0

def main():
    results = []

    for root, dirs, files in os.walk(ROOT_DIR):
        # Modify dirs in-place to skip ignored folders
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for file in files:
            if file.endswith(".ts") or file.endswith(".tsx") or file.endswith(".js") or file.endswith(".jsx"):
                path = os.path.join(root, file)
                lines = count_lines(path)

                if lines > LINE_LIMIT:
                    results.append((lines, path))

    # Sort by line count (descending)
    results.sort(reverse=True)

    for lines, path in results:
        print(f"{lines:>5}  {path}")

if __name__ == "__main__":
    main()


#  1192  .\lib\api\client.ts
#  1169  .\lib\services\tool.service.ts
#  1151  .\entrypoints\background.ts
#   771  .\lib\services\scheduler.service.ts
#   746  .\lib\services\tools\sqp-universal.service.ts
#   646  .\lib\services\indexed-db.service.ts
#   602  .\lib\services\tools\product-niche-metrics.service.ts
#   526  .\lib\services\tools\category-insights.service.ts