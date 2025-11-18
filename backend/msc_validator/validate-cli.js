#!/usr/bin/env node

/**
 * SocialCalc Validator CLI
 * Command-line interface for validating MSC files
 */

const fs = require('fs');
const path = require('path');
const SocialCalcValidator = require('./validator.js');

// Parse command line arguments
const args = process.argv.slice(2);

function printHelp() {
    console.log(`
SocialCalc Validator CLI

USAGE:
    node validate-cli.js [OPTIONS] <file>
    node validate-cli.js [OPTIONS] --string "<msc content>"

OPTIONS:
    --level <1|2|3|all>       Validation level (default: all)
                              1 = Syntax only
                              2 = Syntax + Semantic
                              3 = All levels (Syntax + Semantic + Logic)
                              all = All levels
    
    --verbose, -v             Enable verbose logging
    
    --strict                  Treat warnings as errors
    
    --max-errors <n>          Stop after n errors (default: 100)
    
    --string <content>        Validate string instead of file
    
    --json                    Output results as JSON
    
    --help, -h                Show this help message

EXAMPLES:
    # Validate a file (all levels)
    node validate-cli.js mysheet.msc

    # Validate with verbose output
    node validate-cli.js --verbose mysheet.msc

    # Validate syntax only
    node validate-cli.js --level 1 mysheet.msc

    # Validate syntax and semantic
    node validate-cli.js --level 2 mysheet.msc

    # Validate string content
    node validate-cli.js --string "version:1.5\\ncell:A1:v:10"

    # Strict mode (warnings = errors)
    node validate-cli.js --strict mysheet.msc

    # JSON output for automation
    node validate-cli.js --json mysheet.msc
`);
}

function parseArgs(args) {
    const options = {
        level: 'all',
        verbose: false,
        strict: false,
        maxErrors: 100,
        inputString: null,
        inputFile: null,
        json: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--help':
            case '-h':
                printHelp();
                process.exit(0);
                break;

            case '--level':
                options.level = args[++i];
                if (!['1', '2', '3', 'all'].includes(options.level)) {
                    console.error(`Error: Invalid level '${options.level}'. Must be 1, 2, 3, or all`);
                    process.exit(1);
                }
                break;

            case '--verbose':
            case '-v':
                options.verbose = true;
                break;

            case '--strict':
                options.strict = true;
                break;

            case '--max-errors':
                options.maxErrors = parseInt(args[++i]);
                if (isNaN(options.maxErrors) || options.maxErrors < 1) {
                    console.error('Error: --max-errors must be a positive integer');
                    process.exit(1);
                }
                break;

            case '--string':
                options.inputString = args[++i];
                break;

            case '--json':
                options.json = true;
                break;

            default:
                if (arg.startsWith('--')) {
                    console.error(`Error: Unknown option '${arg}'`);
                    process.exit(1);
                }
                options.inputFile = arg;
        }
    }

    return options;
}

function main() {
    if (args.length === 0) {
        printHelp();
        process.exit(0);
    }

    const options = parseArgs(args);

    // Determine input
    let content;
    if (options.inputString) {
        content = options.inputString.replace(/\\n/g, '\n');
    } else if (options.inputFile) {
        if (!fs.existsSync(options.inputFile)) {
            console.error(`Error: File '${options.inputFile}' not found`);
            process.exit(1);
        }
        content = fs.readFileSync(options.inputFile, 'utf8');
    } else {
        console.error('Error: No input specified. Use a file path or --string option');
        printHelp();
        process.exit(1);
    }

    // Configure validator based on level
    const validatorOptions = {
        verbose: options.verbose,
        strictMode: options.strict,
        maxErrors: options.maxErrors
    };

    switch (options.level) {
        case '1':
            validatorOptions.enableSemanticLevel = false;
            validatorOptions.enableLogicLevel = false;
            break;
        case '2':
            validatorOptions.enableLogicLevel = false;
            break;
        case '3':
        case 'all':
            // All levels enabled by default
            break;
    }

    // Create validator and run
    if (!options.json) {
        console.log('═'.repeat(80));
        console.log('SOCIALCALC VALIDATOR');
        console.log('═'.repeat(80));
        if (options.inputFile) {
            console.log(`File: ${options.inputFile}`);
        } else {
            console.log(`Input: String (${content.length} characters)`);
        }
        console.log(`Validation Level: ${getLevelDescription(options.level)}`);
        console.log(`Strict Mode: ${options.strict ? 'Yes' : 'No'}`);
        console.log('═'.repeat(80));
        console.log('');
    }

    const validator = new SocialCalcValidator(validatorOptions);
    const result = validator.validate(content);

    // Output results
    if (options.json) {
        console.log(JSON.stringify(result, null, 2));
    } else {
        printResults(result);
    }

    // Exit code
    process.exit(result.valid ? 0 : 1);
}

function getLevelDescription(level) {
    switch (level) {
        case '1': return 'Level 1 (Syntax Only)';
        case '2': return 'Level 2 (Syntax + Semantic)';
        case '3':
        case 'all': return 'Level 3 (All - Syntax + Semantic + Logic)';
        default: return 'Unknown';
    }
}

function printResults(result) {
    console.log('');

    if (result.errors.length > 0) {
        console.log('❌ ERRORS:');
        console.log('─'.repeat(80));
        result.errors.forEach(err => {
            console.log(`  Line ${err.line} [${err.level}]: ${err.message}`);
        });
        console.log('');
    }

    if (result.warnings.length > 0) {
        console.log('⚠️  WARNINGS:');
        console.log('─'.repeat(80));
        result.warnings.forEach(warn => {
            console.log(`  Line ${warn.line} [${warn.level}]: ${warn.message}`);
        });
        console.log('');
    }

    console.log('═'.repeat(80));
    console.log('VALIDATION SUMMARY');
    console.log('═'.repeat(80));
    console.log(`Status:           ${result.valid ? '✅ VALID' : '❌ INVALID'}`);
    console.log(`Lines processed:  ${result.stats.linesProcessed}`);
    console.log(`Errors:           ${result.errorCount}`);
    console.log(`Warnings:         ${result.warningCount}`);
    console.log('');
    console.log('Validation checks performed:');
    console.log(`  - Syntax checks:   ${result.stats.syntaxChecks}`);
    console.log(`  - Semantic checks: ${result.stats.semanticChecks}`);
    console.log(`  - Logic checks:    ${result.stats.logicChecks}`);
    console.log('');
    console.log('Style definitions found:');
    console.log(`  - Fonts:        ${result.styleDefinitions.fonts}`);
    console.log(`  - Colors:       ${result.styleDefinitions.colors}`);
    console.log(`  - Borders:      ${result.styleDefinitions.borders}`);
    console.log(`  - Layouts:      ${result.styleDefinitions.layouts}`);
    console.log(`  - Cell formats: ${result.styleDefinitions.cellformats}`);
    console.log(`  - Value formats: ${result.styleDefinitions.valueformats}`);
    console.log('');
    console.log(`Cells found:    ${result.cells}`);
    console.log(`Formulas found: ${result.formulas}`);
    console.log('═'.repeat(80));

    if (result.valid) {
        console.log('\n✅ Validation passed! File is valid and can be loaded.\n');
    } else {
        console.log('\n❌ Validation failed! Please fix the errors above.\n');
    }
}

// Run
main();
