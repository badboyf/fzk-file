#!/usr/bin/python
# -*- coding: UTF-8 -*-

import json
import yaml

PREFIX_DEF = '#/definitions/'
PREFIX_DEF_LEN = len(PREFIX_DEF)
TYPE_OBJECT = 'object';
TYPE_ARRAY = "array"
VALUE = "value"
GET='get'
POST='post'
PUT='put'
LOG_PASS=False

# file1 local    file2 homesis
def process(file1, file2):
	swagger1 = get_swagger_info(file1)
	wf(swagger1, 'C:/tmp/postman-swagger/s1.txt')
	swagger2 = get_swagger_info(file2)
	wf(swagger2, 'C:/tmp/postman-swagger/s2.txt')
	
	process_paths = [
					{	'path' : '/sapp/api/v2/administration/sellerplaceprocess/{processId}', 'method':GET},
					{	'path' : '/sapp/api/v2/administration/submitsellerplaceprocess', 'method':POST},
					{	'path' : '/sapp/api/v2/administration/updatesellerplaceprocess', 'method':PUT},
					{	'path' : '/sapp/api/v2/administration/sellerprocess/{processId}', 'method':GET},
					{	'path' : '/sapp/api/v2/administration/updatesellerprocess', 'method':PUT},
					{	'path' : '/sapp/api/v2/administration/submitsellerprocess', 'method':POST}
					]
	compare_swagger(swagger1, swagger2, process_paths)

def compare_swagger(s1, s2, process_paths = []):
	result = []
	paths1,paths2 = set(),set()
	for path,path_obj in s1['paths'].items():
		for method, method_obj in path_obj.items():
			if not need_process(path, method, process_paths):
				if LOG_PASS:
					print 'pass    ', path, method
				continue
			else:
				print 'process ', path, method
			s2path = s2['paths'].get(path)
			if not s2path:
				print "s2 not exist: " + path
				continue
			s2_method = s2path.get(method)
			if not s2_method:
				print "s2 not exist: " + path + "  method: " + method
				continue
			diff = diff_method(method_obj, s2_method)
			if len(diff) > 0:
				result.append({'path':path, 'method':method, 'diff': diff})
	result = sorted(result, cmp=lambda x,y:[v['path'] for k,v in enumerate(process_paths)].index(x['path']) - [v['path'] for k,v in enumerate(process_paths)].index(y['path']))
	wf(result, filepath = 'C:/tmp/postman-swagger/diff.txt')
def need_process(path, method, process_paths):
	if len(process_paths) > 0:
		for _, value in enumerate(process_paths):
			#if path == "/sapp/api/v2/administration/sellerprocess/{processId}":
			#	print path , value['path'] , method, value['method']
			if path == value['path'] and method == value['method']:
				return True
	return False
def get_swagger_info(filename):
	swagger = load_file(filename)
	definitions = swagger['definitions']
	for path,path_obj in swagger['paths'].items():
		for method, method_obj in path_obj.items():
			if not method_obj.get('parameters'):
				continue
			for param in method_obj['parameters']:
				if (param['in'] == 'body'):
					if (param.get('schema')):
						ref = param['schema']['$ref']
						param['schema']['value'] = parse_ref(ref, definitions, []) 
			response = method_obj['responses']['200']
			if response.get('schema') and response.get('schema').get('$ref'):
				response['value'] = parse_ref(response.get('schema').get('$ref'), definitions, [])
	return swagger
def load_file(filename):
	swagger = {};
	if filename.endswith('.yaml') or filename.endswith('.yml'):
		f = open(filename)
		swagger = yaml.load(f, Loader=yaml.FullLoader)
	else:
		f = open(filename);
		swagger_val = f.read();
		swagger = json.loads(swagger_val)
	f.close()
	return swagger
def parse_ref(ref_str, definitions, already_parsed):
	if ref_str in already_parsed:
		return {}
	already_parsed.append(ref_str)
	ref_str = ref_str[PREFIX_DEF_LEN:];
	ref = definitions[ref_str]
	properties = ref['properties']
	for key, value in properties.items():
		if value.get('$ref'):
			sub_ref_str = value.get('$ref');
			sub_ref = parse_ref(sub_ref_str, definitions, already_parsed)
			value['type'] = TYPE_OBJECT
			value['value'] = sub_ref
		if value.get('type') == TYPE_ARRAY:
			if value['items'].get('$ref'):
				sub_ref = parse_ref(value['items'].get('$ref'), definitions, already_parsed)
				value['value'] = sub_ref
	return properties

def diff_method(m1, m2):
	result = [];
	if m1.get('parameters') and m2.get('parameters'):
		param1 = m1['parameters']
		param2 = m2['parameters']
		if len(param1) == len(param2):
			for index, value in enumerate(param1):
				if value['in'] == param2[index]['in']:
					if value['in'] == 'body' and value.get('schema') and value.get('schema').get('$ref') and m2['parameters'][index].get('schema') and m2['parameters'][index].get('schema').get('$ref'):
						p_diff = diff_ref(value['schema'][VALUE], m2['parameters'][index]['schema'][VALUE])
						if len(p_diff['left']) > 0 or len(p_diff['right']) > 0 or len(p_diff['type_diff']) > 0:
							result.append({'param': p_diff})
		res1, res2 = m1.get('responses').get('200'), m2.get('responses').get('200')
		if res1.get(VALUE) and res2.get(VALUE):
			res_diff = diff_ref(res1.get(VALUE), res2.get(VALUE))
			if len(res_diff['left']) > 0 or len(res_diff['right']) > 0 or len(res_diff['type_diff']) > 0:
				result.append({'res': res_diff})
	return result

def diff_ref(obj1, obj2):
	m1 = get_list(obj1, {}, None)
	m2 = get_list(obj2, {}, None)
	keys1 = set(m1.keys())
	keys2 = set(m2.keys())
	type_diff = []
	for key in keys1:
		if m2.get(key) and m1.get(key) and m2.get(key) != m1.get(key):
			type_diff.append({'key': key, 'left_type': m1.get(key), 'right_type': m2.get(key)})
	return {'left': sorted(list(keys1 - keys2), key = lambda x:(x.count('.'), x)),
			'right': sorted(list(keys2 - keys1), key = lambda x:(x.count('.'), x)),
			'type_diff': type_diff
			}
	
def get_list(obj, result, prefix):
	prefix = prefix + '.' if prefix is not None else ''
	for key, value in obj.items():
		type = value.get('type')
		if type == TYPE_OBJECT or  type == TYPE_ARRAY:
			get_list(value.get(VALUE), result, prefix + key)
		else:
			result[prefix + key] = type
	return result
def wf(json_obj, filepath='C:/tmp/postman-swagger/generate.txt', use_json = True):
	print 'write file : ' + filepath
	f1 = open(filepath, 'w')
	if use_json:
		f1.write(json.dumps(json_obj, indent=2))
	else:
		f1.write(json_obj)
	f1.close()
if __name__ == '__main__':
	process('C:/tmp/postman-swagger/0531-2.0-local.txt', 'C:/tmp/postman-swagger/0531-2.0-homesis.txt')

#	swagger = load_file('C:/tmp/postman-swagger/swagger.yaml')
#	definitions = swagger['definitions']
#	obj1 = parse_ref('#/definitions/RetailerCandidateResponse', definitions, [])
	
#	f = open('C:/tmp/postman-swagger/swagger-min.txt');
#	swagger_val = f.read();
#	swagger = json.loads(swagger_val);
#	definitions = swagger['definitions']
#	
#	obj1 = parse_ref('#/definitions/ActivityInfo', definitions, [])
#	obj2 = parse_ref('#/definitions/SellerPlaceUpdateInfo', definitions, [])
#	diff_ref(obj1, obj2)
#	
#	f1 = open('C:/tmp/postman-swagger/generate.txt', 'w')
#	f1.write(json.dumps(obj1, indent=2))
#	f1.close()
#	#print json.dumps(obj1, indent=2)
