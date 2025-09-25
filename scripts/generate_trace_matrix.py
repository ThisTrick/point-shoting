#!/usr/bin/env python3
"""
Traceability Matrix Generator

Generates a traceability matrix mapping tasks to Functional Requirements (FR) 
and Non-Functional Requirements (NFR) based on comments in tasks.md.

Usage:
    python scripts/generate_trace_matrix.py [--output FORMAT] [--tasks TASKS_FILE]
    
Formats: markdown, csv, json, html
"""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
from dataclasses import dataclass, asdict
from collections import defaultdict


@dataclass
class Task:
    """Represents a single task with its metadata"""
    task_id: str
    description: str
    status: str  # [X], [ ], or [P]
    file_path: Optional[str] = None
    fr_refs: Set[str] = None
    nfr_refs: Set[str] = None
    
    def __post_init__(self):
        if self.fr_refs is None:
            self.fr_refs = set()
        if self.nfr_refs is None:
            self.nfr_refs = set()


@dataclass 
class TraceabilityMatrix:
    """Complete traceability matrix data structure"""
    tasks: List[Task]
    fr_coverage: Dict[str, List[str]]  # FR -> [task_ids]
    nfr_coverage: Dict[str, List[str]]  # NFR -> [task_ids]
    uncovered_requirements: Set[str]
    tasks_without_refs: List[str]
    
    
class TaskParser:
    """Parses tasks.md file and extracts traceability information"""
    
    # Regex patterns for parsing
    TASK_PATTERN = re.compile(r'\|\s*(T\d+)\s*\|\s*(\[[\sXP]\])\s*\|\s*([^|]+?)\s*(?:\([^)]+\))?\s*\|')
    FR_PATTERN = re.compile(r'\b(FR-\d+)\b')
    NFR_PATTERN = re.compile(r'\b(NFR-\d+)\b')
    FILE_PATH_PATTERN = re.compile(r'`([^`]+\.(py|md|json|yml|yaml|sh))`')
    
    def __init__(self, tasks_file: Path):
        self.tasks_file = tasks_file
        
    def parse_tasks(self) -> List[Task]:
        """Parse tasks from tasks.md file"""
        if not self.tasks_file.exists():
            raise FileNotFoundError(f"Tasks file not found: {self.tasks_file}")
            
        tasks = []
        current_task_lines = []
        
        with open(self.tasks_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Find all task entries
        for line in content.split('\n'):
            task_match = self.TASK_PATTERN.match(line.strip())
            if task_match:
                if current_task_lines:
                    # Process previous task
                    task = self._parse_task_group(current_task_lines)
                    if task:
                        tasks.append(task)
                    current_task_lines = []
                
                # Start new task
                current_task_lines.append(line)
            elif current_task_lines and line.strip():
                # Continue current task (multiline description or comments)
                current_task_lines.append(line)
                
        # Process final task
        if current_task_lines:
            task = self._parse_task_group(current_task_lines)
            if task:
                tasks.append(task)
                
        return tasks
    
    def _parse_task_group(self, lines: List[str]) -> Optional[Task]:
        """Parse a group of lines representing a single task"""
        if not lines:
            return None
            
        # Parse main task line
        main_line = lines[0]
        task_match = self.TASK_PATTERN.match(main_line.strip())
        if not task_match:
            return None
            
        task_id = task_match.group(1)
        status = task_match.group(2)
        description = task_match.group(3).strip()
        
        # Combine all lines for full context
        full_text = '\n'.join(lines)
        
        # Extract requirements references
        fr_refs = set(self.FR_PATTERN.findall(full_text))
        nfr_refs = set(self.NFR_PATTERN.findall(full_text))
        
        # Extract file path if present
        file_path = None
        file_matches = self.FILE_PATH_PATTERN.findall(full_text)
        if file_matches:
            file_path = file_matches[0][0]  # First file path found
            
        return Task(
            task_id=task_id,
            description=description,
            status=status,
            file_path=file_path,
            fr_refs=fr_refs,
            nfr_refs=nfr_refs
        )


class MatrixGenerator:
    """Generates traceability matrix from parsed tasks"""
    
    # Known requirements (would typically be loaded from requirements docs)
    KNOWN_FR = {
        'FR-001', 'FR-002', 'FR-003', 'FR-004', 'FR-005', 'FR-006', 'FR-007', 'FR-008',
        'FR-009', 'FR-010', 'FR-011', 'FR-012', 'FR-013', 'FR-014', 'FR-015', 'FR-016',
        'FR-017', 'FR-018', 'FR-019', 'FR-020', 'FR-021', 'FR-022', 'FR-023', 'FR-024',
        'FR-025', 'FR-026', 'FR-027', 'FR-028', 'FR-029', 'FR-030', 'FR-031', 'FR-032',
        'FR-033', 'FR-034', 'FR-035', 'FR-036', 'FR-037', 'FR-038'
    }
    
    KNOWN_NFR = {
        'NFR-001', 'NFR-002', 'NFR-003', 'NFR-004', 'NFR-005', 'NFR-006', 'NFR-007',
        'NFR-008', 'NFR-009'
    }
    
    def generate_matrix(self, tasks: List[Task]) -> TraceabilityMatrix:
        """Generate complete traceability matrix"""
        fr_coverage = defaultdict(list)
        nfr_coverage = defaultdict(list)
        tasks_without_refs = []
        
        # Build coverage maps
        for task in tasks:
            has_refs = False
            
            for fr_ref in task.fr_refs:
                fr_coverage[fr_ref].append(task.task_id)
                has_refs = True
                
            for nfr_ref in task.nfr_refs:
                nfr_coverage[nfr_ref].append(task.task_id)
                has_refs = True
                
            if not has_refs:
                tasks_without_refs.append(task.task_id)
        
        # Find uncovered requirements
        covered_fr = set(fr_coverage.keys())
        covered_nfr = set(nfr_coverage.keys())
        uncovered_requirements = (self.KNOWN_FR - covered_fr) | (self.KNOWN_NFR - covered_nfr)
        
        return TraceabilityMatrix(
            tasks=tasks,
            fr_coverage=dict(fr_coverage),
            nfr_coverage=dict(nfr_coverage),
            uncovered_requirements=uncovered_requirements,
            tasks_without_refs=tasks_without_refs
        )


class MatrixRenderer:
    """Renders traceability matrix in various formats"""
    
    def render_markdown(self, matrix: TraceabilityMatrix) -> str:
        """Render matrix as Markdown"""
        output = []
        
        # Header
        output.append("# Traceability Matrix")
        output.append("")
        output.append(f"**Generated**: {self._get_timestamp()}")
        output.append(f"**Total Tasks**: {len(matrix.tasks)}")
        output.append(f"**Tasks with FR/NFR**: {len(matrix.tasks) - len(matrix.tasks_without_refs)}")
        output.append("")
        
        # Coverage Summary
        output.append("## Coverage Summary")
        output.append("")
        fr_covered = len(matrix.fr_coverage)
        nfr_covered = len(matrix.nfr_coverage)
        fr_total = len(MatrixGenerator.KNOWN_FR)
        nfr_total = len(MatrixGenerator.KNOWN_NFR)
        
        output.append(f"- **Functional Requirements**: {fr_covered}/{fr_total} ({fr_covered/fr_total*100:.1f}%)")
        output.append(f"- **Non-Functional Requirements**: {nfr_covered}/{nfr_total} ({nfr_covered/nfr_total*100:.1f}%)")
        output.append("")
        
        # FR Coverage Table
        if matrix.fr_coverage:
            output.append("## Functional Requirements Coverage")
            output.append("")
            output.append("| Requirement | Tasks | Status |")
            output.append("|-------------|-------|--------|")
            
            for fr in sorted(MatrixGenerator.KNOWN_FR):
                tasks = matrix.fr_coverage.get(fr, [])
                if tasks:
                    task_list = ", ".join(sorted(tasks))
                    status = "✅ Covered"
                else:
                    task_list = "-"
                    status = "❌ Not Covered"
                output.append(f"| {fr} | {task_list} | {status} |")
            output.append("")
        
        # NFR Coverage Table  
        if matrix.nfr_coverage:
            output.append("## Non-Functional Requirements Coverage")
            output.append("")
            output.append("| Requirement | Tasks | Status |")
            output.append("|-------------|-------|--------|")
            
            for nfr in sorted(MatrixGenerator.KNOWN_NFR):
                tasks = matrix.nfr_coverage.get(nfr, [])
                if tasks:
                    task_list = ", ".join(sorted(tasks))
                    status = "✅ Covered"
                else:
                    task_list = "-"
                    status = "❌ Not Covered"
                output.append(f"| {nfr} | {task_list} | {status} |")
            output.append("")
        
        # Tasks without references
        if matrix.tasks_without_refs:
            output.append("## Tasks Without FR/NFR References")
            output.append("")
            for task_id in sorted(matrix.tasks_without_refs):
                task = next(t for t in matrix.tasks if t.task_id == task_id)
                output.append(f"- **{task_id}**: {task.description}")
            output.append("")
        
        # Uncovered requirements
        if matrix.uncovered_requirements:
            output.append("## Uncovered Requirements")
            output.append("")
            for req in sorted(matrix.uncovered_requirements):
                output.append(f"- {req}")
            output.append("")
        
        return "\n".join(output)
    
    def render_csv(self, matrix: TraceabilityMatrix) -> str:
        """Render matrix as CSV"""
        lines = []
        lines.append("Requirement,Type,Tasks,Status")
        
        # FR coverage
        for fr in sorted(MatrixGenerator.KNOWN_FR):
            tasks = matrix.fr_coverage.get(fr, [])
            status = "Covered" if tasks else "Not Covered"
            task_list = ";".join(sorted(tasks)) if tasks else ""
            lines.append(f"{fr},FR,\"{task_list}\",{status}")
        
        # NFR coverage
        for nfr in sorted(MatrixGenerator.KNOWN_NFR):
            tasks = matrix.nfr_coverage.get(nfr, [])
            status = "Covered" if tasks else "Not Covered"
            task_list = ";".join(sorted(tasks)) if tasks else ""
            lines.append(f"{nfr},NFR,\"{task_list}\",{status}")
        
        return "\n".join(lines)
    
    def render_json(self, matrix: TraceabilityMatrix) -> str:
        """Render matrix as JSON"""
        data = {
            "generated": self._get_timestamp(),
            "summary": {
                "total_tasks": len(matrix.tasks),
                "tasks_with_refs": len(matrix.tasks) - len(matrix.tasks_without_refs),
                "fr_covered": len(matrix.fr_coverage),
                "fr_total": len(MatrixGenerator.KNOWN_FR),
                "nfr_covered": len(matrix.nfr_coverage),
                "nfr_total": len(MatrixGenerator.KNOWN_NFR)
            },
            "fr_coverage": matrix.fr_coverage,
            "nfr_coverage": matrix.nfr_coverage,
            "uncovered_requirements": sorted(matrix.uncovered_requirements),
            "tasks_without_refs": sorted(matrix.tasks_without_refs),
            "tasks": [asdict(task) for task in matrix.tasks]
        }
        return json.dumps(data, indent=2, default=str)
    
    def render_html(self, matrix: TraceabilityMatrix) -> str:
        """Render matrix as HTML"""
        # Simple HTML template
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Traceability Matrix</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        table {{ border-collapse: collapse; width: 100%; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #f2f2f2; }}
        .covered {{ color: green; }}
        .not-covered {{ color: red; }}
    </style>
</head>
<body>
    <h1>Traceability Matrix</h1>
    <p><strong>Generated</strong>: {self._get_timestamp()}</p>
    <p><strong>Total Tasks</strong>: {len(matrix.tasks)}</p>
    
    <h2>Functional Requirements Coverage</h2>
    <table>
        <tr><th>Requirement</th><th>Tasks</th><th>Status</th></tr>
"""
        
        for fr in sorted(MatrixGenerator.KNOWN_FR):
            tasks = matrix.fr_coverage.get(fr, [])
            if tasks:
                task_list = ", ".join(sorted(tasks))
                status = '<span class="covered">✅ Covered</span>'
            else:
                task_list = "-"
                status = '<span class="not-covered">❌ Not Covered</span>'
            html += f"        <tr><td>{fr}</td><td>{task_list}</td><td>{status}</td></tr>\n"
        
        html += """
    </table>
    
    <h2>Non-Functional Requirements Coverage</h2>
    <table>
        <tr><th>Requirement</th><th>Tasks</th><th>Status</th></tr>
"""
        
        for nfr in sorted(MatrixGenerator.KNOWN_NFR):
            tasks = matrix.nfr_coverage.get(nfr, [])
            if tasks:
                task_list = ", ".join(sorted(tasks))
                status = '<span class="covered">✅ Covered</span>'
            else:
                task_list = "-"
                status = '<span class="not-covered">❌ Not Covered</span>'
            html += f"        <tr><td>{nfr}</td><td>{task_list}</td><td>{status}</td></tr>\n"
        
        html += """
    </table>
</body>
</html>
"""
        return html
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Generate traceability matrix from tasks.md")
    parser.add_argument("--output", "-o", choices=["markdown", "csv", "json", "html"], 
                       default="markdown", help="Output format")
    parser.add_argument("--tasks", "-t", type=Path, 
                       default="specs/001-/tasks.md", help="Tasks file path")
    parser.add_argument("--file", "-f", type=Path, help="Output file path")
    
    args = parser.parse_args()
    
    try:
        # Parse tasks
        parser = TaskParser(args.tasks)
        tasks = parser.parse_tasks()
        
        # Generate matrix
        generator = MatrixGenerator()
        matrix = generator.generate_matrix(tasks)
        
        # Render output
        renderer = MatrixRenderer()
        if args.output == "markdown":
            output = renderer.render_markdown(matrix)
        elif args.output == "csv":
            output = renderer.render_csv(matrix)
        elif args.output == "json":
            output = renderer.render_json(matrix)
        elif args.output == "html":
            output = renderer.render_html(matrix)
        
        # Write output
        if args.file:
            with open(args.file, 'w', encoding='utf-8') as f:
                f.write(output)
            print(f"Traceability matrix written to: {args.file}")
        else:
            print(output)
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()