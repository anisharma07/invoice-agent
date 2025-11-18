# SocialCalc Save Format Syntax Reference

## 📋 General Format

```
linetype:param1:param2:param3:...
```

- Each line starts with a **line type**
- Parameters are separated by `:` (colon)
- Special characters are escaped: `\n` (newline), `\c` (colon), `\\` (backslash)

---

## 📦 Line Types Overview

| Line Type | Purpose | Required | References |
|-----------|---------|----------|------------|
| `version` | Format version | ✅ Yes (first line) | None |
| `cell` | Cell data & formatting | No | font, color, border, layout, cellformat, valueformat |
| `sheet` | Sheet properties | Recommended | font, color, layout, cellformat, valueformat |
| `col` | Column properties | No | None |
| `row` | Row properties | No | None |
| `font` | Font definition | No | None |
| `color` | Color definition | No | None |
| `border` | Border definition | No | None |
| `layout` | Layout/padding definition | No | None |
| `cellformat` | Cell alignment definition | No | None |
| `valueformat` | Number/value format definition | No | None |
| `name` | Named range definition | No | None |

---

## 1️⃣ VERSION Line

**Syntax:**
```
version:<version_number>
```

| Parameter | Type | Valid Values | Required |
|-----------|------|--------------|----------|
| version_number | string | `1.0`, `1.1`, `1.2`, `1.3`, `1.4`, `1.5` | ✅ |

**Example:**
```
version:1.5
```

**Rules:**
- ✅ Must be the **first line** of the file
- ✅ Only one version line allowed
- ✅ Version 1.5 is the latest

---

## 2️⃣ CELL Line

**Syntax:**
```
cell:<coord>:<attr1>:<value1>:<attr2>:<value2>:...
```

### Cell Coordinates

| Format | Example | Description |
|--------|---------|-------------|
| `A1` | `cell:A1:...` | Column A, Row 1 |
| `B10` | `cell:B10:...` | Column B, Row 10 |
| `AA1` | `cell:AA1:...` | Column AA, Row 1 |

### Cell Value Attributes

| Attribute | Syntax | Description | Example |
|-----------|--------|-------------|---------|
| **Text value** | `t:<text>` | Plain text | `cell:A1:t:Hello World` |
| **Numeric value** | `v:<number>` | Number | `cell:A1:v:123.45` |
| **Value with type** | `vt:<type>:<value>` | Typed value | `cell:A1:vt:n:100` |
| **Formula** | `vtf:<type>:<value>:<formula>` | Formula with result | `cell:A1:vtf:n:30:A1+A2` |
| **Constant** | `vtc:<type>:<value>:<text>` | Formatted constant | `cell:A1:vtc:n:1.20:$1.20` |
| **Error** | `e:<error>` | Error message | `cell:A1:e:#DIV/0!` |

#### Value Types

| Type | Description | Example |
|------|-------------|---------|
| `n` | Numeric | `vtf:n:100:SUM(A1:A5)` |
| `t` | Text | `vtf:t:hello:UPPER("hello")` |
| `nd` | Numeric date | `vtf:nd:45951:TODAY()` |
| `nt` | Numeric time | `vtf:nt:0.5:TIME(12,0,0)` |
| `n$` | Currency | `vtf:n$:1.20:A1*0.1` |
| `nl` | Logical | `vtf:nl:1:TRUE()` |
| `ne` | Error | `vtf:ne:#N/A:NA()` |

**Examples:**
```
cell:A1:t:Hello
cell:A2:v:100
cell:A3:vtf:n:30:A1+A2
cell:A4:vtf:nd:45951:TODAY()
cell:A5:t:Line 1\nLine 2\nLine 3
```

### Cell Formatting Attributes

| Attribute | Syntax | Description | References | Example |
|-----------|--------|-------------|------------|---------|
| **Font** | `f:<num>` | Font style | `font:<num>` | `cell:A1:t:Bold:f:1` |
| **Text color** | `c:<num>` | Text color | `color:<num>` | `cell:A1:t:Red:c:1` |
| **Background** | `bg:<num>` | Background color | `color:<num>` | `cell:A1:bg:1` |
| **Borders** | `b:<t>:<r>:<b>:<l>` | Border (top,right,bottom,left) | `border:<num>` | `cell:A1:b:1:1:1:1` |
| **Layout** | `l:<num>` | Padding/alignment | `layout:<num>` | `cell:A1:l:1` |
| **Cell format** | `cf:<num>` | Horizontal alignment | `cellformat:<num>` | `cell:A1:cf:1` |
| **Text format** | `tvf:<num>` | Text value format | `valueformat:<num>` | `cell:A1:tvf:1` |
| **Number format** | `ntvf:<num>` | Number value format | `valueformat:<num>` | `cell:A1:ntvf:1` |
| **Colspan** | `colspan:<num>` | Merge columns | None | `cell:A1:colspan:2` |
| **Rowspan** | `rowspan:<num>` | Merge rows | None | `cell:A1:rowspan:2` |
| **CSS class** | `cssc:<name>` | Custom CSS class | None | `cell:A1:cssc:myclass` |
| **CSS style** | `csss:<style>` | Custom CSS style | None | `cell:A1:csss:color\cred` |
| **Modifiable** | `mod:<y/n>` | Allow modification | None | `cell:A1:mod:y` |
| **Comment** | `comment:<text>` | Cell comment | None | `cell:A1:comment:Note` |

**Examples:**
```
cell:A1:t:Centered:cf:1
cell:A2:t:Red Text:c:1
cell:A3:t:Yellow BG:bg:2
cell:A4:t:Bordered:b:1:1:1:1
cell:A5:t:Merged:colspan:2:rowspan:2
cell:A6:v:1234.56:ntvf:1
```

### Complete Cell Example
```
cell:A1:t:Hello World:f:1:c:2:bg:3:cf:1:b:1:1:1:1:colspan:2
```
This creates cell A1 with:
- Text: "Hello World"
- Font: #1
- Text color: #2
- Background: #3
- Alignment: #1
- Borders: #1 on all sides
- Merged: 2 columns

---

## 3️⃣ SHEET Line

**Syntax:**
```
sheet:<attr1>:<value1>:<attr2>:<value2>:...
```

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `c` | number | Last column number | `sheet:c:10` |
| `r` | number | Last row number | `sheet:r:20` |
| `w` | string | Default column width | `sheet:w:100` |
| `h` | string | Default row height | `sheet:h:20` |
| `font` | number | Default font | `sheet:font:1` |
| `color` | number | Default text color | `sheet:color:1` |
| `bgcolor` | number | Default background color | `sheet:bgcolor:2` |
| `layout` | number | Default layout | `sheet:layout:1` |
| `tf` | number | Default text format | `sheet:tf:1` |
| `ntf` | number | Default number format | `sheet:ntf:2` |
| `ntvf` | number | Default number value format | `sheet:ntvf:1` |
| `tvf` | number | Default text value format | `sheet:tvf:2` |
| `recalc` | string | Recalc mode (on/off) | `sheet:recalc:on` |

**Examples:**
```
sheet:c:10:r:20
sheet:c:5:r:10:w:100:h:25
sheet:c:3:r:3:font:1:color:2
```

---

## 4️⃣ COL Line

**Syntax:**
```
col:<column>:<attr1>:<value1>:...
```

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| column | string | Column reference (A, B, AA, etc.) | `col:A` |

| Attribute | Type | Description | Values |
|-----------|------|-------------|--------|
| `w` | string | Width | `100`, `auto`, `50%` |
| `hide` | string | Hide column | `yes`, `no` |

**Examples:**
```
col:A:w:200
col:B:w:auto
col:C:w:50%
col:D:hide:yes
```

---

## 5️⃣ ROW Line

**Syntax:**
```
row:<row_number>:<attr1>:<value1>:...
```

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| row_number | number | Row number | `row:1` |

| Attribute | Type | Description | Values |
|-----------|------|-------------|--------|
| `h` | string | Height | `20`, `auto`, `30%` |
| `hide` | string | Hide row | `yes`, `no` |

**Examples:**
```
row:1:h:30
row:2:hide:yes
row:3:h:auto
```

---

## 6️⃣ FONT Line

**Syntax:**
```
font:<number>:<style> <weight> <size> <family>
```

| Component | Values | Example |
|-----------|--------|---------|
| `<style>` | `normal`, `italic`, `*` | `normal`, `italic` |
| `<weight>` | `normal`, `bold`, `*` | `normal`, `bold` |
| `<size>` | `6pt`-`72pt`, `8px`-`36px`, `small`, `medium`, `large`, `x-large`, `*` | `12pt`, `14px` |
| `<family>` | Font name(s), `*` | `Arial`, `'Times New Roman',serif` |

**Note:** `*` means use default value

**Examples:**
```
font:1:normal bold 14pt Arial,Helvetica,sans-serif
font:2:italic normal 12pt 'Times New Roman',serif
font:3:* bold * *
font:4:* * 18pt *
font:5:normal bold 32pt Arial
font:6:* x-large *
font:7:* * 10px Verdana
```

---

## 7️⃣ COLOR Line

**Syntax:**
```
color:<number>:<color_value>
```

| Format | Example |
|--------|---------|
| RGB | `color:1:rgb(255,0,0)` |
| Hex | `color:2:#FF0000` |

**Examples:**
```
color:1:rgb(255,0,0)
color:2:rgb(0,255,0)
color:3:rgb(0,0,255)
color:4:rgb(255,255,0)
color:5:#FF0000
color:6:#00FF00
```

**Common Colors:**
```
color:1:rgb(255,0,0)         # Red
color:2:rgb(0,255,0)         # Green
color:3:rgb(0,0,255)         # Blue
color:4:rgb(255,255,0)       # Yellow
color:5:rgb(0,0,0)           # Black
color:6:rgb(255,255,255)     # White
color:7:rgb(128,128,128)     # Gray
```

---

## 8️⃣ BORDER Line

**Syntax:**
```
border:<number>:<thickness> <style> <color>
```

| Component | Values | Example |
|-----------|--------|---------|
| `<thickness>` | `1px`, `2px`, etc. | `1px`, `2px` |
| `<style>` | `solid`, `dashed`, `dotted`, `double` | `solid` |
| `<color>` | RGB or hex color | `rgb(0,0,0)` |

**Examples:**
```
border:1:1px solid rgb(0,0,0)
border:2:2px dashed rgb(255,0,0)
border:3:1px dotted rgb(0,0,255)
border:4:3px double rgb(0,0,0)
```

**Usage in Cell:**
```
cell:A1:t:Bordered:b:1:1:1:1
```
Order: top, right, bottom, left

```
cell:A1:t:Top Only:b:1:0:0:0
cell:A2:t:Left Right:b:0:1:0:1
cell:A3:t:All Sides:b:1:1:1:1
```

---

## 9️⃣ LAYOUT Line

**Syntax:**
```
layout:<number>:padding:<top> <right> <bottom> <left>;vertical-align:<value>;
```

| Component | Values | Example |
|-----------|--------|---------|
| `padding` | `10px`, `*` (default) | `padding:10px 20px 10px 20px;` |
| `vertical-align` | `top`, `middle`, `bottom`, `*` | `vertical-align:top;` |

**Note:** `*` means use default value

**Examples:**
```
layout:1:padding:10px * * *;vertical-align:*;
layout:2:padding:* * * *;vertical-align:top;
layout:3:padding:20px 20px 20px 20px;vertical-align:middle;
layout:4:padding:5px 10px 5px 10px;vertical-align:bottom;
```

---

## 🔟 CELLFORMAT Line

**Syntax:**
```
cellformat:<number>:<alignment>
```

| Alignment | Description | Example |
|-----------|-------------|---------|
| `left` | Left align | `cellformat:1:left` |
| `center` | Center align | `cellformat:2:center` |
| `right` | Right align | `cellformat:3:right` |

**Examples:**
```
cellformat:1:left
cellformat:2:center
cellformat:3:right
```

**Usage:**
```
cell:A1:t:Left Text:cf:1
cell:A2:t:Centered:cf:2
cell:A3:t:Right Text:cf:3
```

---

## 1️⃣1️⃣ VALUEFORMAT Line

**Syntax:**
```
valueformat:<number>:<pattern>
```

### Number Formats

| Pattern | Description | Example Output | Example |
|---------|-------------|----------------|---------|
| `#,##0` | Number with commas | 1,234 | `valueformat:1:#,##0` |
| `#,##0.00` | Two decimals | 1,234.56 | `valueformat:2:#,##0.00` |
| `#,##0.0000` | Four decimals | 1,234.5678 | `valueformat:3:#,##0.0000` |
| `0` | Integer | 1234 | `valueformat:4:0` |
| `0.00%` | Percentage | 75.00% | `valueformat:5:0.00%` |

### Currency Formats

| Pattern | Description | Example Output | Example |
|---------|-------------|----------------|---------|
| `$#,##0` | Dollar, no decimals | $1,234 | `valueformat:10:$#,##0` |
| `$#,##0.00` | Dollar, 2 decimals | $1,234.56 | `valueformat:11:$#,##0.00` |
| `($#,##0)` | Parentheses for negative | ($1,234) | `valueformat:12:($#,##0)` |

### Date Formats

| Pattern | Description | Example Output | Example |
|---------|-------------|----------------|---------|
| `m/d/yy` | Short date | 1/4/06 | `valueformat:20:m/d/yy` |
| `mm/dd/yyyy` | Full date | 01/04/2006 | `valueformat:21:mm/dd/yyyy` |
| `yyyy-mm-dd` | ISO date | 2006-01-04 | `valueformat:22:yyyy-mm-dd` |
| `d-mmm-yy` | Short month | 4-Jan-06 | `valueformat:23:d-mmm-yy` |
| `dd-mmm-yyyy` | Full month | 04-Jan-2006 | `valueformat:24:dd-mmm-yyyy` |
| `mmmm d, yyyy` | Long format | January 4, 2006 | `valueformat:25:mmmm d, yyyy` |

### Time Formats

| Pattern | Description | Example Output | Example |
|---------|-------------|----------------|---------|
| `h\cmm` | 12-hour | 12:30 | `valueformat:30:h\cmm` |
| `h\cmm AM/PM` | 12-hour with AM/PM | 12:30 PM | `valueformat:31:h\cmm AM/PM` |
| `h\cmm\css` | With seconds | 12:30:45 | `valueformat:32:h\cmm\css` |
| `hh\cmm\css` | Padded | 12:30:45 | `valueformat:33:hh\cmm\css` |

**Note:** `\c` is escaped colon for time formats

### Text Formats

| Pattern | Description | Example |
|---------|-------------|---------|
| `text-plain` | Plain text | `valueformat:40:text-plain` |
| `text-html` | HTML content | `valueformat:41:text-html` |
| `text-wiki` | Wiki markup | `valueformat:42:text-wiki` |
| `text-link` | Hyperlink | `valueformat:43:text-link` |

**Examples:**
```
valueformat:1:#,##0.00
valueformat:2:$#,##0.00
valueformat:3:dd-mmm-yyyy
valueformat:4:h\cmm AM/PM
valueformat:5:text-html
```

---

## 1️⃣2️⃣ NAME Line

**Syntax:**
```
name:<name>:<description>:<value>
```

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| name | string | Name (uppercase) | `TOTAL` |
| description | string | Description (encoded) | `Total Sales` |
| value | string | Cell ref, range, or formula | `B5`, `A1:B7`, `=SUM(A1:A10)` |

**Examples:**
```
name:TOTAL:Total Sales:B5
name:RANGE:Data Range:A1:B7
name:FORMULA:Calculation:=SUM(A1:A10)
```

---

## 🔢 Formula Syntax

### Cell References

| Type | Syntax | Example |
|------|--------|---------|
| Single cell | `A1`, `B5`, `AA10` | `=A1+B1` |
| Range | `A1:B5`, `C1:C10` | `=SUM(A1:B5)` |
| Escaped range | `A1\cB5` | In save format |

**Note:** In formulas stored in cell lines, `:` is escaped as `\c`

### Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `+` | Addition | `A1+B1` |
| `-` | Subtraction | `A1-B1` |
| `*` | Multiplication | `A1*B1` |
| `/` | Division | `A1/B1` |
| `^` | Power | `A1^2` |
| `&` | Concatenation | `A1&" "&B1` |
| `=` | Equal | `A1=B1` |
| `<>` | Not equal | `A1<>B1` |
| `<` | Less than | `A1<B1` |
| `>` | Greater than | `A1>B1` |
| `<=` | Less or equal | `A1<=B1` |
| `>=` | Greater or equal | `A1>=B1` |

### Math Functions

| Function | Description | Syntax | Example |
|----------|-------------|--------|---------|
| `ABS` | Absolute value | `ABS(number)` | `vtf:n:123:ABS(-123)` |
| `SUM` | Sum range | `SUM(range)` | `vtf:n:100:SUM(A1\cA5)` |
| `AVERAGE` | Average | `AVERAGE(range)` | `vtf:n:50:AVERAGE(A1\cA5)` |
| `MIN` | Minimum | `MIN(range)` | `vtf:n:10:MIN(A1\cA5)` |
| `MAX` | Maximum | `MAX(range)` | `vtf:n:90:MAX(A1\cA5)` |
| `ROUND` | Round number | `ROUND(num,digits)` | `vtf:n:3.46:ROUND(3.456,2)` |
| `SQRT` | Square root | `SQRT(number)` | `vtf:n:4:SQRT(16)` |
| `POWER` | Power | `POWER(base,exp)` | `vtf:n:8:POWER(2,3)` |
| `PI` | Pi constant | `PI()` | `vtf:n:3.14159:PI()` |
| `SIN` | Sine | `SIN(angle)` | `vtf:n:0.85:SIN(45)` |
| `COS` | Cosine | `COS(angle)` | `vtf:n:0.53:COS(45)` |
| `TAN` | Tangent | `TAN(angle)` | `vtf:n:1.62:TAN(45)` |
| `MOD` | Modulo | `MOD(num,divisor)` | `vtf:n:1:MOD(10,3)` |
| `INT` | Integer | `INT(number)` | `vtf:n:7:INT(7.8)` |

### Text Functions

| Function | Description | Syntax | Example |
|----------|-------------|--------|---------|
| `UPPER` | Uppercase | `UPPER(text)` | `vtf:t:HELLO:UPPER("hello")` |
| `LOWER` | Lowercase | `LOWER(text)` | `vtf:t:hello:LOWER("HELLO")` |
| `PROPER` | Title case | `PROPER(text)` | `vtf:t:Hello:PROPER("hello")` |
| `LEN` | Length | `LEN(text)` | `vtf:n:5:LEN("hello")` |
| `LEFT` | Left chars | `LEFT(text,num)` | `vtf:t:he:LEFT("hello",2)` |
| `RIGHT` | Right chars | `RIGHT(text,num)` | `vtf:t:lo:RIGHT("hello",2)` |
| `MID` | Middle chars | `MID(text,start,len)` | `vtf:t:ell:MID("hello",2,3)` |
| `FIND` | Find position | `FIND(find,text)` | `vtf:n:1:FIND("a","abc")` |
| `SUBSTITUTE` | Replace text | `SUBSTITUTE(text,old,new)` | `vtf:t:ho:SUBSTITUTE("hi","i","o")` |

### Date/Time Functions

| Function | Description | Syntax | Example |
|----------|-------------|--------|---------|
| `TODAY` | Today's date | `TODAY()` | `vtf:nd:45951:TODAY()` |
| `NOW` | Current date/time | `NOW()` | `vtf:nd:45951.5:NOW()` |
| `DATE` | Create date | `DATE(y,m,d)` | `vtf:n:38718:DATE(2006,1,4)` |
| `YEAR` | Extract year | `YEAR(date)` | `vtf:n:2006:YEAR(38718)` |
| `MONTH` | Extract month | `MONTH(date)` | `vtf:n:1:MONTH(38718)` |
| `DAY` | Extract day | `DAY(date)` | `vtf:n:4:DAY(38718)` |
| `HOUR` | Extract hour | `HOUR(time)` | `vtf:n:12:HOUR(0.5)` |
| `MINUTE` | Extract minute | `MINUTE(time)` | `vtf:n:30:MINUTE(0.5208)` |
| `SECOND` | Extract second | `SECOND(time)` | `vtf:n:45:SECOND(0.5214)` |
| `TIME` | Create time | `TIME(h,m,s)` | `vtf:n:0.521:TIME(12,30,45)` |

### Logical Functions

| Function | Description | Syntax | Example |
|----------|-------------|--------|---------|
| `IF` | Conditional | `IF(test,true,false)` | `vtf:t:yes:IF(1>0,"yes","no")` |
| `AND` | Logical AND | `AND(val1,val2,...)` | `vtf:nl:1:AND(1,1)` |
| `OR` | Logical OR | `OR(val1,val2,...)` | `vtf:nl:1:OR(0,1)` |
| `NOT` | Logical NOT | `NOT(value)` | `vtf:nl:0:NOT(1)` |
| `TRUE` | True value | `TRUE()` | `vtf:nl:1:TRUE()` |
| `FALSE` | False value | `FALSE()` | `vtf:nl:0:FALSE()` |

### Lookup Functions

| Function | Description | Syntax | Example |
|----------|-------------|--------|---------|
| `CHOOSE` | Choose by index | `CHOOSE(idx,v1,v2,...)` | `vtf:t:b:CHOOSE(2,"a","b","c")` |
| `INDEX` | Get cell from range | `INDEX(range,row,col)` | `vtf:n:123:INDEX(A1\cB2,1,2)` |
| `MATCH` | Find position | `MATCH(val,range,type)` | `vtf:n:2:MATCH(2,A1\cA5,0)` |

### Statistical Functions

| Function | Description | Syntax | Example |
|----------|-------------|--------|---------|
| `COUNT` | Count numbers | `COUNT(range)` | `vtf:n:5:COUNT(A1\cA5)` |
| `COUNTA` | Count non-empty | `COUNTA(range)` | `vtf:n:5:COUNTA(A1\cA5)` |
| `COUNTBLANK` | Count empty | `COUNTBLANK(range)` | `vtf:n:2:COUNTBLANK(A1\cA5)` |
| `COUNTIF` | Count with criteria | `COUNTIF(range,criteria)` | `vtf:n:3:COUNTIF(A1\cA5,">10")` |
| `SUMIF` | Sum with criteria | `SUMIF(range,criteria)` | `vtf:n:150:SUMIF(A1\cA5,">10")` |
| `STDEV` | Standard deviation | `STDEV(range)` | `vtf:n:2:STDEV(A1\cA5)` |
| `VAR` | Variance | `VAR(range)` | `vtf:n:4:VAR(A1\cA5)` |

### Financial Functions

| Function | Description | Syntax |
|----------|-------------|--------|
| `PMT` | Payment | `PMT(rate,nper,pv)` |
| `PV` | Present value | `PV(rate,nper,pmt)` |
| `FV` | Future value | `FV(rate,nper,pmt)` |
| `NPV` | Net present value | `NPV(rate,val1,val2,...)` |
| `IRR` | Internal rate of return | `IRR(values)` |

---

## 🔗 Line Type Relationships

```
┌─────────────┐
│   version   │ ← Must be first line
└─────────────┘

┌─────────────┐
│    sheet    │ ← Defines spreadsheet properties
└─────────────┘
      │
      ├─ Can reference: font, color, layout, cellformat, valueformat
      │

┌─────────────┐
│    cell     │ ← Defines cell content & formatting
└─────────────┘
      │
      ├─ Can reference: font, color, border, layout, cellformat, valueformat
      ├─ Uses formulas with cell references (A1, B2, etc.)
      │

┌─────────────┐
│ col / row   │ ← Defines column/row properties
└─────────────┘

┌──────────────────────────────────────────────────────┐
│ Definitions (must exist if referenced by cell/sheet) │
├──────────────────────────────────────────────────────┤
│  font, color, border, layout, cellformat, valueformat│
└──────────────────────────────────────────────────────┘
```

---

## 📝 Complete Examples

### Example 1: Simple Text Cell
```
version:1.5
cell:A1:t:Hello World
sheet:c:1:r:1
```

### Example 2: Formatted Text
```
version:1.5
cell:A1:t:Red Bold Text:f:1:c:1
sheet:c:1:r:1
font:1:normal bold 14pt Arial
color:1:rgb(255,0,0)
```

### Example 3: Bordered Cell
```
version:1.5
cell:A1:t:Bordered Cell:b:1:1:1:1
sheet:c:1:r:1
border:1:1px solid rgb(0,0,0)
```

### Example 4: Merged Cells
```
version:1.5
cell:A1:t:Merged Cell:colspan:2:rowspan:2
cell:B1:
cell:A2:
cell:B2:
sheet:c:2:r:2
```

### Example 5: Formula with Sum
```
version:1.5
cell:A1:v:10
cell:A2:v:20
cell:A3:v:30
cell:A4:vtf:n:60:SUM(A1\cA3)
sheet:c:1:r:4
```

### Example 6: Formatted Currency
```
version:1.5
cell:A1:v:1234.56:ntvf:1
sheet:c:1:r:1
valueformat:1:$#,##0.00
```

### Example 7: Date with Format
```
version:1.5
cell:A1:vtf:nd:45951:TODAY():ntvf:1
sheet:c:1:r:1
valueformat:1:dd-mmm-yyyy
```

### Example 8: Alignment
```
version:1.5
cell:A1:t:Left:cf:1
cell:A2:t:Center:cf:2
cell:A3:t:Right:cf:3
sheet:c:1:r:3
cellformat:1:left
cellformat:2:center
cellformat:3:right
```

### Example 9: Complete Invoice Row
```
cell:B13:vtf:nd:45951:TODAY():ntvf:1:b:0:0:0:1
cell:C13:t:Web Services:b:0:0:0:0:colspan:3
cell:F13:v:1500:ntvf:2:b:0:0:0:0
cell:G13:v:1:b:0:0:0:0:cf:2
cell:H13:vtf:n:1500:F13*G13:ntvf:2:b:0:0:1:0
```

---

## 🎯 Quick Reference Card

### Essential Line Types
```
version:1.5                              ← Always first
cell:A1:t:text                           ← Basic text
cell:A2:v:123                            ← Number
cell:A3:vtf:n:30:SUM(A1\cA2)            ← Formula
sheet:c:10:r:20                          ← Sheet size
font:1:normal bold 12pt Arial            ← Font def
color:1:rgb(255,0,0)                     ← Color def
border:1:1px solid rgb(0,0,0)            ← Border def
cellformat:1:center                      ← Alignment
valueformat:1:$#,##0.00                  ← Number format
```

### Cell Attributes Quick Ref
```
t:text         → Plain text
v:number       → Numeric value
f:1            → Font reference
c:1            → Text color
bg:1           → Background color
b:1:1:1:1      → Borders (t,r,b,l)
cf:1           → Cell format (alignment)
ntvf:1         → Number format
colspan:2      → Merge columns
rowspan:2      → Merge rows
```

---

**End of Syntax Reference** 📖
