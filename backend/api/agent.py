"""
AI Agent API routes.
"""
from flask import Blueprint, request, jsonify
from agents.socialcalc_agent import SocialCalcAgent
from agents.mapping_agent import mapping_agent

agent_bp = Blueprint('agent', __name__, url_prefix='/api')

# Initialize the agent
agent = SocialCalcAgent()


@agent_bp.route('/generate', methods=['POST'])
def generate_code():
    """
    Generate or edit SocialCalc code based on user prompt

    Request JSON:
    {
        "prompt": "user's natural language request",
        "current_code": "optional - current sheet code for editing mode",
        "mode": "optional - 'generate' or 'edit' (auto-detected if not provided)"
    }

    Response JSON:
    {
        "success": true,
        "data": {
            "savestr": "SocialCalc format code",
            "mode": "generate or edit",
            "reasoning": "explanation of what was done"
        }
    }
    """
    try:
        data = request.get_json()

        if not data or 'prompt' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing prompt in request body'
            }), 400

        prompt = data.get('prompt', '').strip()
        current_code = data.get('current_code', '').strip()
        mode = data.get('mode', None)

        if not prompt:
            return jsonify({
                'success': False,
                'error': 'Prompt cannot be empty'
            }), 400

        # Generate/edit code using the agent
        result = agent.process_request(
            prompt=prompt,
            current_code=current_code if current_code else None,
            mode=mode
        )

        if result['success']:
            return jsonify({
                'success': True,
                'data': result['data']
            })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Unknown error occurred')
            }), 500

    except Exception as e:
        print(f"Error in generate_code endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500


@agent_bp.route('/generate-mapping', methods=['POST'])
def generate_mapping():
    """
    Generate JSON mapping structure from MSC code using AI

    Request JSON:
    {
        "mscCode": "SocialCalc MSC format code"
    }

    Response JSON:
    {
        "success": true,
        "data": {
            "mapping": { ... generated mapping ... },
            "fieldCount": number
        }
    }
    """
    try:
        data = request.get_json()

        if not data or 'mscCode' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing mscCode in request body'
            }), 400

        msc_code = data.get('mscCode', '').strip()

        if not msc_code:
            return jsonify({
                'success': False,
                'error': 'mscCode cannot be empty'
            }), 400

        # Generate mapping using the AI agent
        result = mapping_agent.generate_mapping(msc_code)

        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 500

    except Exception as e:
        print(f"Error in generate_mapping endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500


@agent_bp.route('/convert-to-json', methods=['POST'])
def convert_to_json():
    """
    Convert SocialCalc format code to JSON format

    Request JSON:
    {
        "savestr": "SocialCalc format code",
        "sheet_name": "optional sheet name (default: sheet1)"
    }

    Response JSON:
    {
        "success": true,
        "data": {
            "numsheets": 1,
            "currentid": "sheet1",
            "currentname": "sheet1",
            "sheetArr": {...}
        }
    }
    """
    try:
        data = request.get_json()

        if not data or 'savestr' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing savestr in request body'
            }), 400

        savestr = data.get('savestr', '').strip()
        sheet_name = data.get('sheet_name', 'sheet1')

        if not savestr:
            return jsonify({
                'success': False,
                'error': 'savestr cannot be empty'
            }), 400

        # Convert to JSON format
        json_data = {
            "numsheets": 1,
            "currentid": sheet_name,
            "currentname": sheet_name,
            "sheetArr": {
                sheet_name: {
                    "sheetstr": {
                        "savestr": savestr
                    },
                    "name": sheet_name,
                    "hidden": "0"
                }
            }
        }

        return jsonify({
            'success': True,
            'data': json_data
        })

    except Exception as e:
        print(f"Error in convert_to_json endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500
