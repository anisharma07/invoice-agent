
import { DATA } from '../src/templates';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/admin/seed-templates';

async function seed() {
    console.log('Preparing templates...');
    const templates = Object.values(DATA).map(t => ({
        filename: String(t.templateId) + '.json', // Use ID as filename for easy lookup
        content: JSON.stringify(t)      // Serialize the whole object
    }));

    console.log(`Seeding ${templates.length} templates to ${API_URL}...`);

    try {
        const response = await axios.post(API_URL, { templates });
        console.log('Seed result:', response.data);
    } catch (error: any) {
        console.error('Error seeding templates:', error.response?.data || error.message);
    }
}

seed();
