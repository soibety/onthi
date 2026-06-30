import json
import re
import unicodedata
from docx import Document

DOCX_PATH = "doc/CASE_LS_GP.docx"
OUTPUT_PATH = "cases.json"

QUESTION_RE = re.compile(r"^Câu\s+(\d+)\.\s*(.+)$", re.IGNORECASE)
CHOICE_RE = re.compile(r"^([A-E])\.\s*(.+)$")
ANSWER_RE = re.compile(r"^Đáp án:\s*([A-E])\s*$", re.IGNORECASE)
HINT_RE = re.compile(r"^Hint:\s*(.*)$", re.IGNORECASE)
CASE_RE = re.compile(r"^Case\s+\d+\s*:\s*(.+)$", re.IGNORECASE)

def normalize_text(text):
    text = unicodedata.normalize("NFC", text or "")
    text = text.replace("\xa0", " ")
    return text.strip()

def read_docx_lines(path):
    doc = Document(path)
    lines = []

    for para in doc.paragraphs:
        raw = unicodedata.normalize("NFC", para.text or "").replace("\xa0", " ")
        for part in raw.splitlines():
            text = part.strip()
            if not text or text == "[<br>]":
                continue
            lines.append(text)

    return lines

def answer_letter_to_index(letter):
    return ord(letter.upper()) - ord("A") + 1

def parse_questions(lines):
    results = []
    current_case = ""

    i = 0
    while i < len(lines):
        line = lines[i]

        case_match = CASE_RE.match(line)
        if case_match:
            current_case = line
            i += 1
            continue

        question_match = QUESTION_RE.match(line)
        if not question_match:
            i += 1
            continue

        question_id = int(question_match.group(1))
        question_text = question_match.group(2).strip()

        i += 1
        choices = []
        while i < len(lines):
            choice_match = CHOICE_RE.match(lines[i])
            if not choice_match:
                break
            choices.append(choice_match.group(2).strip())
            i += 1

        if len(choices) != 5:
            continue

        if i >= len(lines):
            continue

        answer_match = ANSWER_RE.match(lines[i])
        if not answer_match:
            continue
        correct = answer_letter_to_index(answer_match.group(1))
        i += 1

        hint = ""
        if i < len(lines):
            hint_match = HINT_RE.match(lines[i])
            if hint_match:
                hint = hint_match.group(1).strip()
                i += 1

        results.append({
            "id": question_id,
            "case": current_case,
            "question": question_text,
            "choices": choices,
            "correct": correct,
            "hint": hint,
        })

    return results

def main():
    lines = read_docx_lines(DOCX_PATH)
    questions = parse_questions(lines)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=4)

    print(f"Đã ghi {len(questions)} câu vào {OUTPUT_PATH}")

if __name__ == "__main__":
    main()