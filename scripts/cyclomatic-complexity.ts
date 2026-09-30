import fs from 'fs';
import path from 'path';
import ts from 'typescript';

interface FunctionMetric {
  name: string;
  file: string;
  line: number;
  complexity: number;
  loc: number;
  risk: 'Low' | 'Moderate' | 'High' | 'Very High';
}

interface FileMetric {
  filePath: string;
  relativeFilePath: string;
  totalComplexity: number;
  functionCount: number;
  averageComplexity: number;
  maxComplexity: number;
  loc: number;
  functions: FunctionMetric[];
}

function getRiskCategory(complexity: number): 'Low' | 'Moderate' | 'High' | 'Very High' {
  if (complexity <= 10) return 'Low';
  if (complexity <= 20) return 'Moderate';
  if (complexity <= 50) return 'High';
  return 'Very High';
}

function getFunctionName(node: ts.Node, sourceFile: ts.SourceFile): string {
  if (ts.isFunctionDeclaration(node) && node.name) {
    return node.name.text;
  }
  if (ts.isMethodDeclaration(node) && node.name) {
    return node.name.getText(sourceFile);
  }
  if (ts.isConstructorDeclaration(node)) {
    return 'constructor';
  }
  if (ts.isGetAccessor(node) && node.name) {
    return `get ${node.name.getText(sourceFile)}`;
  }
  if (ts.isSetAccessor(node) && node.name) {
    return `set ${node.name.getText(sourceFile)}`;
  }

  // Check parent for variable assignment or property assignment
  const parent = node.parent;
  if (parent) {
    if (ts.isVariableDeclaration(parent) && parent.name) {
      return parent.name.getText(sourceFile);
    }
    if (ts.isPropertyAssignment(parent) && parent.name) {
      return parent.name.getText(sourceFile);
    }
    if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      return parent.left.getText(sourceFile);
    }
    if (ts.isCallExpression(parent)) {
      const callName = parent.expression.getText(sourceFile);
      return `<callback in ${callName}>`;
    }
  }

  return '<anonymous>';
}

function isDecisionPoint(node: ts.Node): boolean {
  switch (node.kind) {
    case ts.SyntaxKind.IfStatement:
    case ts.SyntaxKind.ConditionalExpression: // ? :
    case ts.SyntaxKind.CaseClause:
    case ts.SyntaxKind.CatchClause:
    case ts.SyntaxKind.WhileStatement:
    case ts.SyntaxKind.DoStatement:
    case ts.SyntaxKind.ForStatement:
    case ts.SyntaxKind.ForInStatement:
    case ts.SyntaxKind.ForOfStatement:
      return true;

    case ts.SyntaxKind.BinaryExpression: {
      const bin = node as ts.BinaryExpression;
      const op = bin.operatorToken.kind;
      return (
        op === ts.SyntaxKind.AmpersandAmpersandToken ||
        op === ts.SyntaxKind.BarBarToken ||
        op === ts.SyntaxKind.QuestionQuestionToken
      );
    }

    default:
      return false;
  }
}

function isFunctionScope(node: ts.Node): boolean {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isGetAccessor(node) ||
    ts.isSetAccessor(node)
  );
}

function analyzeFunctionComplexity(fnNode: ts.Node, sourceFile: ts.SourceFile, relativePath: string): FunctionMetric {
  let decisionPoints = 0;

  function visit(node: ts.Node) {
    if (node !== fnNode && isFunctionScope(node)) {
      // Do not count nested functions' internal decision points in outer function
      return;
    }

    if (isDecisionPoint(node)) {
      decisionPoints++;
    }

    ts.forEachChild(node, visit);
  }

  // Visit children of function
  ts.forEachChild(fnNode, visit);

  const complexity = 1 + decisionPoints;
  const { line } = sourceFile.getLineAndCharacterOfPosition(fnNode.getStart(sourceFile));
  const endPos = sourceFile.getLineAndCharacterOfPosition(fnNode.getEnd());
  const loc = Math.max(1, endPos.line - line + 1);

  return {
    name: getFunctionName(fnNode, sourceFile),
    file: relativePath,
    line: line + 1,
    complexity,
    loc,
    risk: getRiskCategory(complexity),
  };
}

function analyzeFile(filePath: string, rootDir: string): FileMetric | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativeFilePath = path.relative(rootDir, filePath).replace(/\\/g, '/');

  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const functions: FunctionMetric[] = [];

  function walk(node: ts.Node) {
    if (isFunctionScope(node)) {
      functions.push(analyzeFunctionComplexity(node, sourceFile, relativeFilePath));
    }
    ts.forEachChild(node, walk);
  }

  walk(sourceFile);

  const lines = content.split('\n').length;
  const totalComplexity = functions.reduce((acc, f) => acc + f.complexity, 0);
  const functionCount = functions.length;
  const averageComplexity = functionCount > 0 ? parseFloat((totalComplexity / functionCount).toFixed(2)) : 1;
  const maxComplexity = functions.length > 0 ? Math.max(...functions.map((f) => f.complexity)) : 1;

  return {
    filePath,
    relativeFilePath,
    totalComplexity,
    functionCount,
    averageComplexity,
    maxComplexity,
    loc: lines,
    functions,
  };
}

function getAllSourceFiles(dir: string, fileList: string[] = []): string[] {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (item !== 'node_modules' && item !== 'dist' && item !== '.git') {
        getAllSourceFiles(fullPath, fileList);
      }
    } else if (stat.isFile()) {
      if (
        (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) &&
        !fullPath.endsWith('.d.ts')
      ) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

export function runCyclomaticTest() {
  const projectRoot = process.cwd();
  console.log('='.repeat(80));
  console.log('  ERUS CYCLOMATIC COMPLEXITY (McCabe Metric) CODEBASE AUDIT');
  console.log('='.repeat(80));
  console.log(`Scan Target: ${projectRoot}`);

  const targetDirs = [path.join(projectRoot, 'src')];
  const serverPath = path.join(projectRoot, 'server.ts');

  let files: string[] = [];
  targetDirs.forEach((d) => {
    if (fs.existsSync(d)) {
      getAllSourceFiles(d, files);
    }
  });

  if (fs.existsSync(serverPath)) {
    files.push(serverPath);
  }

  console.log(`Discovered ${files.length} TypeScript source files for AST parsing...\n`);

  const fileMetrics: FileMetric[] = [];
  const allFunctions: FunctionMetric[] = [];

  for (const file of files) {
    const metric = analyzeFile(file, projectRoot);
    if (metric) {
      fileMetrics.push(metric);
      allFunctions.push(...metric.functions);
    }
  }

  // Aggregate stats
  const totalFunctions = allFunctions.length;
  const totalComplexitySum = allFunctions.reduce((s, f) => s + f.complexity, 0);
  const overallAvgComplexity = totalFunctions > 0 ? (totalComplexitySum / totalFunctions).toFixed(2) : '0';
  const totalLOC = fileMetrics.reduce((s, f) => s + f.loc, 0);

  const lowRisk = allFunctions.filter((f) => f.risk === 'Low');
  const modRisk = allFunctions.filter((f) => f.risk === 'Moderate');
  const highRisk = allFunctions.filter((f) => f.risk === 'High');
  const vHighRisk = allFunctions.filter((f) => f.risk === 'Very High');

  console.log('--------------------------------------------------------------------------------');
  console.log('SUMMARY METRICS:');
  console.log(`  Total Files Analyzed       : ${fileMetrics.length}`);
  console.log(`  Total Source Code Lines    : ${totalLOC.toLocaleString()}`);
  console.log(`  Total Functions Analyzed   : ${totalFunctions}`);
  console.log(`  Average Complexity / Func  : ${overallAvgComplexity}`);
  console.log('--------------------------------------------------------------------------------');
  console.log('RISK DISTRIBUTION (NIST / McCabe Standard):');
  console.log(`  🟢 Low Risk (1 - 10)       : ${lowRisk.length.toString().padStart(4)} (${((lowRisk.length / totalFunctions) * 100).toFixed(1)}%) - Simple, testable`);
  console.log(`  🟡 Moderate Risk (11 - 20)  : ${modRisk.length.toString().padStart(4)} (${((modRisk.length / totalFunctions) * 100).toFixed(1)}%) - Moderately complex`);
  console.log(`  🟠 High Risk (21 - 50)      : ${highRisk.length.toString().padStart(4)} (${((highRisk.length / totalFunctions) * 100).toFixed(1)}%) - Complex, refactor candidate`);
  console.log(`  🔴 Very High Risk (> 50)    : ${vHighRisk.length.toString().padStart(4)} (${((vHighRisk.length / totalFunctions) * 100).toFixed(1)}%) - Untestable, high hazard`);
  console.log('--------------------------------------------------------------------------------\n');

  // Top 15 most complex functions
  const sortedFunctions = [...allFunctions].sort((a, b) => b.complexity - a.complexity);
  console.log('TOP 15 HIGHEST CYCLOMATIC COMPLEXITY FUNCTIONS / MODULES:');
  console.log(
    'Rank'.padEnd(6) +
    'Complexity'.padEnd(12) +
    'Risk'.padEnd(12) +
    'LOC'.padEnd(8) +
    'Function / Component'.padEnd(35) +
    'File Location'
  );
  console.log('-'.repeat(105));

  sortedFunctions.slice(0, 15).forEach((fn, idx) => {
    const rankStr = `#${idx + 1}`.padEnd(6);
    const compStr = `CC: ${fn.complexity}`.padEnd(12);
    const riskStr = fn.risk.padEnd(12);
    const locStr = `${fn.loc}L`.padEnd(8);
    const nameStr = (fn.name.length > 33 ? fn.name.slice(0, 30) + '...' : fn.name).padEnd(35);
    const fileStr = `${fn.file}:${fn.line}`;
    console.log(`${rankStr}${compStr}${riskStr}${locStr}${nameStr}${fileStr}`);
  });

  console.log('\n' + '-'.repeat(105));
  console.log('TOP 10 FILES BY AGGREGATE COMPLEXITY:');
  console.log(
    'Rank'.padEnd(6) +
    'Total CC'.padEnd(12) +
    'Avg CC'.padEnd(10) +
    'Max CC'.padEnd(10) +
    'Funcs'.padEnd(8) +
    'File'
  );
  console.log('-'.repeat(105));

  const sortedFiles = [...fileMetrics].sort((a, b) => b.totalComplexity - a.totalComplexity);
  sortedFiles.slice(0, 10).forEach((file, idx) => {
    const rankStr = `#${idx + 1}`.padEnd(6);
    const totStr = `${file.totalComplexity}`.padEnd(12);
    const avgStr = `${file.averageComplexity}`.padEnd(10);
    const maxStr = `${file.maxComplexity}`.padEnd(10);
    const fnStr = `${file.functionCount}`.padEnd(8);
    console.log(`${rankStr}${totStr}${avgStr}${maxStr}${fnStr}${file.relativeFilePath}`);
  });

  console.log('='.repeat(80));
}

runCyclomaticTest();
