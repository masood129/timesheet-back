const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Load base swagger configuration
const baseSwagger = {
  openapi: '3.0.3',
  info: {
    title: 'Timesheet API',
    description: 'API for managing projects, daily details, and monthly reports with MSSQL integration for a Flutter calendar app',
    version: '1.0.0'
  },
  servers: [
    {
      url: process.env.API_URL || 'http://localhost:3000',
      description: 'API Server'
    }
  ],
  paths: {},
  components: {
    schemas: {},
    securitySchemes: {}
  },
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Projects', description: 'Project management endpoints' },
    { name: 'DailyDetails', description: 'Daily details endpoints' },
    { name: 'MonthlyReports', description: 'Monthly reports endpoints' },
    { name: 'Users', description: 'User management endpoints' },
    { name: 'Admin - Users', description: 'Admin user management endpoints' },
    { name: 'Admin - Projects', description: 'Admin project management endpoints' },
    { name: 'Admin - Groups', description: 'Admin group management endpoints' },
    { name: 'Admin - Reports', description: 'Admin reports and analytics endpoints' },
    { name: 'Admin - Config', description: 'Admin system configuration endpoints' },
    { name: 'Admin - Month Periods', description: 'Admin month period settings endpoints' },
    { name: 'Admin - Logs', description: 'Admin logs management endpoints' },
    { name: 'Test', description: 'Test endpoints' }
  ]
};

// Function to load and parse YAML file
function loadYAML(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return yaml.load(fileContent);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
    return null;
  }
}

// Load components
const componentsDir = path.join(__dirname, 'components');
if (fs.existsSync(componentsDir)) {
  const securityFile = path.join(componentsDir, 'security.yaml');
  const schemasFile = path.join(componentsDir, 'schemas.yaml');
  
  if (fs.existsSync(securityFile)) {
    const security = loadYAML(securityFile);
    if (security && security.securitySchemes) {
      baseSwagger.components.securitySchemes = security.securitySchemes;
    }
  }
  
  if (fs.existsSync(schemasFile)) {
    const schemas = loadYAML(schemasFile);
    if (schemas && schemas.schemas) {
      baseSwagger.components.schemas = schemas.schemas;
    }
  }
}

// Load all path files
const pathsDir = path.join(__dirname, 'paths');
if (fs.existsSync(pathsDir)) {
  const pathFiles = fs.readdirSync(pathsDir).filter(file => file.endsWith('.yaml'));
  
  for (const file of pathFiles) {
    const filePath = path.join(pathsDir, file);
    const paths = loadYAML(filePath);
    if (paths && paths.paths) {
      Object.assign(baseSwagger.paths, paths.paths);
    }
  }
  
  // Load admin paths
  const adminDir = path.join(pathsDir, 'admin');
  if (fs.existsSync(adminDir)) {
    const adminFiles = fs.readdirSync(adminDir).filter(file => file.endsWith('.yaml'));
    for (const file of adminFiles) {
      const filePath = path.join(adminDir, file);
      const paths = loadYAML(filePath);
      if (paths && paths.paths) {
        Object.assign(baseSwagger.paths, paths.paths);
      }
    }
  }
}

// Write combined JSON file
const outputPath = path.join(__dirname, 'swagger.json');
fs.writeFileSync(outputPath, JSON.stringify(baseSwagger, null, 2), 'utf8');
console.log(`✅ Swagger JSON file created successfully at ${outputPath}`);
console.log(`   Total paths: ${Object.keys(baseSwagger.paths).length}`);

