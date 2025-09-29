#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');
const builder = require('xmlbuilder');
const path = require('path');

const OUTPUT_DIR = path.join(process.cwd());
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'test_plan.jmx');
const DEFAULT_FILE = path.join(__dirname, 'sample.json');

// --- Input file ---
const inputFile = process.argv[2] || DEFAULT_FILE;
if (!fs.existsSync(inputFile)) {
  console.error(`Error: file not found: ${inputFile}`);
  process.exit(1);
}

// Remove old JMX
if (fs.existsSync(OUTPUT_FILE)) fs.unlinkSync(OUTPUT_FILE);
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// --- Load file (JSON or YAML) ---
let data;
try {
  const fileContent = fs.readFileSync(inputFile, 'utf8');
  if (inputFile.endsWith('.json')) {
    data = JSON.parse(fileContent);
  } else if (inputFile.endsWith('.yaml') || inputFile.endsWith('.yml')) {
    data = yaml.load(fileContent);
  } else {
    throw new Error('Unsupported file format. Use .json or .yaml');
  }
console.log('\x1b[32m%s\x1b[0m', `✅ Successfully loaded: ${inputFile}`);
} catch (err) {
  console.error(`Error reading file: ${err.message}`);
  process.exit(1);
}

// --- HTTP methods ---
const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

// --- Convert OpenAPI schema to example JSON ---
function buildJsonFromSchema(schema) {
  if (!schema || !schema.properties) return {};
  const result = {};
  for (const [key, value] of Object.entries(schema.properties)) {
    if (value.example !== undefined) result[key] = value.example;
    else if (value.type === 'object') result[key] = buildJsonFromSchema(value);
    else if (value.type === 'array') result[key] = value.items ? [buildJsonFromSchema(value.items)] : [];
    else result[key] = null;
  }
  return result;
}

// --- Group endpoints by tag ---
const tagsMap = {};
Object.keys(data.paths).forEach(path => {
  const pathItem = data.paths[path];
  Object.keys(pathItem).forEach(method => {
    if (!httpMethods.includes(method.toLowerCase())) return;
    const endpoint = pathItem[method];
    const tags = endpoint.tags && endpoint.tags.length ? endpoint.tags : ['Default'];
    tags.forEach(tag => {
      if (!tagsMap[tag]) tagsMap[tag] = [];
      const jsonBody = endpoint.requestBody?.content?.['application/json']?.schema
        ? buildJsonFromSchema(endpoint.requestBody.content['application/json'].schema)
        : null;
      tagsMap[tag].push({
        path,
        method: method.toUpperCase(),
        body: jsonBody
      });
    });
  });
});

// --- Build JMeter XML ---
const testPlan = builder.create('jmeterTestPlan', { encoding: 'UTF-8' })
  .att('version', '1.2')
  .att('properties', '5.0')
  .att('jmeter', '5.6.3');

const hashTree = testPlan.ele('hashTree');

// --- Test Plan ---
const testPlanNode = hashTree.ele('TestPlan', {
  guiclass: 'TestPlanGui',
  testclass: 'TestPlan',
  testname: 'Test Plan',
  enabled: 'true'
});

// User Defined Variables
testPlanNode.ele('elementProp', {
  name: 'TestPlan.user_defined_variables',
  elementType: 'Arguments',
  guiclass: 'ArgumentsPanel',
  testclass: 'Arguments',
  testname: 'User Defined Variables'
}).ele('collectionProp', { name: 'Arguments.arguments' });

const testPlanHash = hashTree.ele('hashTree');

// --- CSV Data Set Config ---
const csvConfig = testPlanHash.ele('CSVDataSet', {
  guiclass: 'TestBeanGUI',
  testclass: 'CSVDataSet',
  testname: 'CSV Data Set Config',
  enabled: 'false'
});
csvConfig.ele('stringProp', { name: 'filename' }, 'data.csv');
csvConfig.ele('boolProp', { name: 'recycle' }, 'true');
csvConfig.ele('boolProp', { name: 'stopThread' }, 'false');
csvConfig.ele('stringProp', { name: 'variableNames' }, 'userId,userName');
testPlanHash.ele('hashTree');

// --- HTTP Header Manager ---
const headerManager = testPlanHash.ele('HeaderManager', {
  guiclass: 'HeaderPanel',
  testclass: 'HeaderManager',
  testname: 'HTTP Header Manager',
  enabled: 'true'
});
const headersCollection = headerManager.ele('collectionProp', { name: 'HeaderManager.headers' });
['Accept: application/json', 'Content-Type: application/json'].forEach(h => {
  const [name, value] = h.split(':').map(s => s.trim());
  const header = headersCollection.ele('elementProp', { name, elementType: 'Header' });
  header.ele('stringProp', { name: 'Header.name' }, name);
  header.ele('stringProp', { name: 'Header.value' }, value);
});
testPlanHash.ele('hashTree');

// --- HTTP Request Defaults ---
const httpDefaults = testPlanHash.ele('ConfigTestElement', {
  guiclass: 'HttpDefaultsGui',
  testclass: 'ConfigTestElement',
  testname: 'HTTP Request Defaults',
  enabled: 'true'
});
httpDefaults.ele('stringProp', { name: 'HTTPSampler.domain' }, 'petstore3.swagger.io');
httpDefaults.ele('stringProp', { name: 'HTTPSampler.port' }, '443');
httpDefaults.ele('stringProp', { name: 'HTTPSampler.protocol' }, 'https');
httpDefaults.ele('elementProp', { name: 'HTTPsampler.Arguments', elementType: 'Arguments', guiclass: 'HTTPArgumentsPanel', testclass: 'Arguments', testname: 'User Defined Variables' })
  .ele('collectionProp', { name: 'Arguments.arguments' });
httpDefaults.ele('stringProp', { name: 'HTTPSampler.implementation' }, 'HttpClient4');
testPlanHash.ele('hashTree');

// --- JSR223 PreProcessor at Test Plan level ---
const preProcessor = testPlanHash.ele('JSR223PreProcessor', {
  guiclass: 'TestBeanGUI',
  testclass: 'JSR223PreProcessor',
  testname: 'JSR223 PreProcessor',
  enabled: 'true'
});
preProcessor.ele('stringProp', { name: 'cacheKey' }, 'true');
preProcessor.ele('stringProp', { name: 'filename' }, '');
preProcessor.ele('stringProp', { name: 'parameters' }, '');
preProcessor.ele('stringProp', { name: 'script' }, `
import org.apache.jmeter.protocol.http.control.Header
import org.apache.jmeter.protocol.http.control.HeaderManager

// Get current sampler
def sampler = ctx.getCurrentSampler()

// --- Update the path ---
// Example: prepend "api/v3/" to existing path
def currentPath = sampler.getPath()   // get current path
def newPath = "api/v3/" + currentPath // modify path
sampler.setPath(newPath)              // set updated path
`);
testPlanHash.ele('hashTree');

// --- JSR223 PostProcessor at Test Plan level ---
const postProcessor = testPlanHash.ele('JSR223PostProcessor', {
  guiclass: 'TestBeanGUI',
  testclass: 'JSR223PostProcessor',
  testname: 'JSR223 PostProcessor',
  enabled: 'true'
});
postProcessor.ele('stringProp', { name: 'cacheKey' }, 'true');
postProcessor.ele('stringProp', { name: 'filename' }, '');
postProcessor.ele('stringProp', { name: 'parameters' }, '');
postProcessor.ele('stringProp', { name: 'script' }, `
def response = prev.getResponseDataAsString()
log.info("=== Raw Response ===\\n" + response)
log.info("Response Code: " + prev.getResponseCode())
log.info("Response Message: " + prev.getResponseMessage())
log.info("Response Time (ms): " + prev.getTime())
log.info("Sampler Label: " + prev.getSampleLabel())
log.info("Response Headers:\\n" + prev.getResponseHeaders())
log.info("Request Headers:\\n" + prev.getRequestHeaders())
`);
testPlanHash.ele('hashTree');


// --- Thread Group ---
const threadGroup = testPlanHash.ele('ThreadGroup', {
  guiclass: 'ThreadGroupGui',
  testclass: 'ThreadGroup',
  testname: 'Thread Group',
  enabled: 'true'
});
threadGroup.ele('intProp', { name: 'ThreadGroup.num_threads' }, '1');
threadGroup.ele('intProp', { name: 'ThreadGroup.ramp_time' }, '1');
threadGroup.ele('boolProp', { name: 'ThreadGroup.same_user_on_next_iteration' }, 'true');
threadGroup.ele('stringProp', { name: 'ThreadGroup.on_sample_error' }, 'continue');

const loopController = threadGroup.ele('elementProp', {
  name: 'ThreadGroup.main_controller',
  elementType: 'LoopController',
  guiclass: 'LoopControlPanel',
  testclass: 'LoopController',
  testname: 'Loop Controller'
});
loopController.ele('stringProp', { name: 'LoopController.loops' }, '1');
loopController.ele('boolProp', { name: 'LoopController.continue_forever' }, 'false');

const threadHash = testPlanHash.ele('hashTree');


// --- Add controllers and samplers ---
Object.keys(tagsMap).forEach(tag => {
  const controller = threadHash.ele('GenericController', {
    guiclass: 'LogicControllerGui',
    testclass: 'GenericController',
    testname: tag,
    enabled: 'true'
  });
  const controllerHash = threadHash.ele('hashTree');

  tagsMap[tag].forEach(endpoint => {
    const sampler = controllerHash.ele('HTTPSamplerProxy', {
      guiclass: 'HttpTestSampleGui',
      testclass: 'HTTPSamplerProxy',
      testname: `${endpoint.method} ${endpoint.path}`,
      enabled: 'true'
    });
    sampler.ele('boolProp', { name: 'HTTPSampler.follow_redirects' }, 'true');
    sampler.ele('boolProp', { name: 'HTTPSampler.use_keepalive' }, 'true');
    sampler.ele('boolProp', { name: 'HTTPSampler.postBodyRaw' }, endpoint.body ? 'true' : 'false');
    sampler.ele('stringProp', { name: 'HTTPSampler.method' }, endpoint.method);

    const args = sampler.ele('elementProp', { name: 'HTTPsampler.Arguments', elementType: 'Arguments' });
    const collection = args.ele('collectionProp', { name: 'Arguments.arguments' });

    if (endpoint.body) {
      const arg = collection.ele('elementProp', { name: '', elementType: 'HTTPArgument' });
      arg.ele('boolProp', { name: 'HTTPArgument.always_encode' }, 'false');
      arg.ele('stringProp', { name: 'Argument.value' }, JSON.stringify(endpoint.body, null, 2));
      arg.ele('stringProp', { name: 'Argument.metadata' }, '=');
    }

    sampler.ele('stringProp', { name: 'HTTPSampler.path' }, endpoint.path.replace(/^\//, ''));
    controllerHash.ele('hashTree');

  });
});

// --- Write output ---
fs.writeFileSync(OUTPUT_FILE, testPlan.end({ pretty: true }), 'utf8');
console.log('\x1b[32m%s\x1b[0m', `✅ JMeter test plan generated: ${OUTPUT_FILE}`);
console.log('\x1b[33m%s\x1b[0m', 
  '⚠️  Copy test_plan.jmx to your project then run to avoid writing jmter.log in ' + DEFAULT_FILE
);
