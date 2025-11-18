# Logging Quick Reference Guide

## Quick Commands

### View Logs
```bash
# View entire log file
cat invoice_agent.log

# Follow live logs (real-time)
tail -f invoice_agent.log

# View last 50 lines
tail -n 50 invoice_agent.log

# View and follow with line numbers
tail -f invoice_agent.log | nl
```

### Search Logs
```bash
# Find logs for specific request ID
grep "[a1b2c3d4]" invoice_agent.log

# Find all errors
grep "ERROR" invoice_agent.log

# Find all warnings
grep "WARNING" invoice_agent.log

# Find validation failures
grep "Validation FAILED" invoice_agent.log

# Find successful completions
grep "COMPLETED SUCCESSFULLY" invoice_agent.log

# Count errors
grep -c "ERROR" invoice_agent.log

# Show errors with context (3 lines before/after)
grep -A 3 -B 3 "ERROR" invoice_agent.log
```

### Filter by Component
```bash
# API routes logs only
grep "app.api.routes" invoice_agent.log

# Template agent logs only
grep "app.services.template_generation_agent" invoice_agent.log

# Main application logs
grep "app.main" invoice_agent.log
```

### Time-based Filtering
```bash
# Logs from specific date
grep "2025-11-15" invoice_agent.log

# Logs from specific hour
grep "2025-11-15 10:" invoice_agent.log

# Logs from specific minute
grep "2025-11-15 10:30:" invoice_agent.log
```

### Analysis
```bash
# Count total requests
grep "GENERATE-INVOICE API REQUEST STARTED" invoice_agent.log | wc -l

# Count successful requests
grep "COMPLETED SUCCESSFULLY" invoice_agent.log | wc -l

# Count failed requests
grep "REQUEST FAILED" invoice_agent.log | wc -l

# Average validation attempts (requires awk)
grep "Validation Attempts:" invoice_agent.log | awk '{sum+=$NF; count++} END {print sum/count}'
```

## Log Structure

### Request ID Format
- Format: `[xxxxxxxx]` (8 characters)
- Example: `[a1b2c3d4]`
- Unique per request
- Appears in all route-level logs

### Log Entry Format
```
<timestamp> - <module> - <level> - <message>
```

Example:
```
2025-11-15 10:30:15 - app.api.routes - INFO - [a1b2c3d4] GENERATE-INVOICE API REQUEST STARTED
```

### Pipeline Stages
1. **Request Started** - API request received
2. **Session Management** - Session created/retrieved
3. **Pipeline Started** - Template generation begins
4. **Step 1/4** - Cell mappings generation
5. **Step 2/4** - SaveStr generation
6. **Step 3/4** - Validation loop (may repeat)
7. **Step 4/4** - Response generation
8. **Pipeline Completed** - Template generation done
9. **Request Completed** - API response sent

### Log Markers
- `===...===` - Major section boundaries
- `[Step X/Y]` - Pipeline step markers
- `✓` - Success indicator
- `✗` - Failure indicator
- `→` - Action or transition
- `•` - List item

## Common Log Patterns

### Successful Request
```
[xxxxxxxx] GENERATE-INVOICE API REQUEST STARTED
[xxxxxxxx] Session Management: Creating new session
[Step 1/4] GENERATING CELL MAPPINGS AND METADATA
✓ Cell mappings generated successfully
[Step 2/4] GENERATING SOCIALCALC SAVE STRING (MSC)
✓ SaveStr generated successfully
[Step 3/4] VALIDATION LOOP WITH AUTO-CORRECTION
  Validation Attempt 1/5
  ✓ Validation PASSED
[Step 4/4] GENERATING USER RESPONSE
✓ Response generated
TEMPLATE GENERATION PIPELINE COMPLETED
Status: ✓ SUCCESS
[xxxxxxxx] GENERATE-INVOICE API REQUEST COMPLETED SUCCESSFULLY
```

### Request with Validation Retries
```
[Step 3/4] VALIDATION LOOP WITH AUTO-CORRECTION
  Validation Attempt 1/5
  ✗ Validation FAILED with 3 errors
    Error 1: <error message>
    Error 2: <error message>
    Error 3: <error message>
  → Requesting fixes from SaveStr Agent...
  ✓ Received corrected savestr
  Validation Attempt 2/5
  ✓ Validation PASSED
```

### Failed Request
```
[xxxxxxxx] GENERATE-INVOICE API REQUEST STARTED
[Step 1/4] GENERATING CELL MAPPINGS AND METADATA
✗ Cell mapping generation failed
  Error Type: ValueError
  Error Message: <message>
  Traceback: <full traceback>
[xxxxxxxx] GENERATE-INVOICE API REQUEST FAILED
```

## Debugging Tips

### Track a Specific Request
1. Get the request ID from the API response or initial log
2. Filter logs: `grep "[request_id]" invoice_agent.log`
3. Follow the flow through all stages

### Find Validation Issues
```bash
# Find all validation failures
grep "Validation FAILED" invoice_agent.log

# Find requests that needed multiple attempts
grep "Validation Attempt 2" invoice_agent.log

# Find requests that hit max retries
grep "Max retries" invoice_agent.log
```

### Performance Analysis
```bash
# Extract timestamps for a request
grep "[a1b2c3d4]" invoice_agent.log | awk '{print $1, $2}'

# Find slow validations (multiple attempts)
grep -B 5 "Validation Attempt 3" invoice_agent.log
```

### Error Investigation
```bash
# Find all exceptions with context
grep -A 10 "ERROR" invoice_agent.log

# Find specific error types
grep "ValueError" invoice_agent.log
grep "HTTPException" invoice_agent.log

# Get full traceback
grep -A 20 "Traceback:" invoice_agent.log
```

## Log Rotation

### Manual Rotation
```bash
# Archive current log
mv invoice_agent.log invoice_agent.log.$(date +%Y%m%d_%H%M%S)

# Compress old logs
gzip invoice_agent.log.*

# Server will create new file automatically
```

### Clean Old Logs
```bash
# Remove logs older than 7 days
find . -name "invoice_agent.log.*" -mtime +7 -delete

# Remove compressed logs older than 30 days
find . -name "invoice_agent.log.*.gz" -mtime +30 -delete
```

## Integration with Tools

### Grep + Less (Paginated View)
```bash
grep "[a1b2c3d4]" invoice_agent.log | less
```

### Watch for Errors
```bash
# Monitor for new errors in real-time
tail -f invoice_agent.log | grep --line-buffered "ERROR"
```

### JSON Export (for analysis)
```bash
# Extract key metrics to JSON (example)
grep "Validation Attempts:" invoice_agent.log | \
  awk '{print "{\"attempts\": " $NF "}"}' > metrics.json
```

### Send to Log Analysis Tools
```bash
# Example: Send to rsyslog
tail -f invoice_agent.log | logger -t invoice_agent

# Example: Send to Elasticsearch (requires curl/jq)
tail -f invoice_agent.log | while read line; do
  echo "$line" | jq -R . | curl -X POST localhost:9200/logs/_doc -d @-
done
```

## Troubleshooting

### Log File Not Created
- Check write permissions in the backend directory
- Ensure the application is running
- Check `main.py` for logging configuration

### Logs Not Appearing
- Check log level: Should be INFO or DEBUG
- Verify logger is configured in the module
- Check that logging is not disabled

### Too Much Log Output
- Increase log level to WARNING or ERROR for production
- Implement log rotation
- Filter specific modules in `main.py`

### Missing Context
- Increase log level to DEBUG temporarily
- Add more logging statements in relevant code sections
- Check if request ID is being propagated correctly

## Best Practices

1. **Always use request IDs** when investigating specific issues
2. **Check validation attempts** to understand retry patterns
3. **Monitor error rates** to detect systemic issues
4. **Archive logs regularly** to prevent disk space issues
5. **Use grep patterns** to quickly find relevant information
6. **Combine with application metrics** for complete picture

## Support

For issues or questions about logging:
1. Check the log patterns in this guide
2. Review `docs/LOGGING_IMPLEMENTATION.md` for architecture details
3. Review `docs/LOGGING_SUMMARY.md` for complete overview
4. Check code comments in `main.py`, `routes.py`, and `template_generation_agent.py`
