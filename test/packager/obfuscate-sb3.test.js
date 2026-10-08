import JSZip from '@turbowarp/jszip';
import obfuscateSB3Project from '../../src/packager/obfuscate-sb3';

test('obfuscates the SB3 project and preserves its assets and cloud-variable settings', async () => {
  const originalProjectData = {
    targets: [{
      isStage: true,
      variables: {
        'cloud-variable-id': ['☁ Score', 0, true]
      },
      lists: {},
      blocks: {},
      comments: {},
      broadcasts: {},
      costumes: [],
      sounds: []
    }],
    monitors: []
  };
  const originalZip = new JSZip();
  originalZip.file('project.json', JSON.stringify(originalProjectData));
  originalZip.file('assets/example.txt', 'preserved');
  const originalArrayBuffer = await originalZip.generateAsync({type: 'arraybuffer'});
  const project = {
    type: 'sb3',
    arrayBuffer: originalArrayBuffer
  };
  const options = {
    cloudVariables: {
      custom: {
        '☁ Score': 'local'
      }
    }
  };

  const result = await obfuscateSB3Project(project, options, JSZip);
  const resultZip = await JSZip.loadAsync(result.arrayBuffer);
  const projectData = JSON.parse(await resultZip.file('project.json').async('string'));
  const renamedVariable = projectData.targets[0].variables['cloud-variable-id'][0];

  expect(renamedVariable).not.toBe('☁ Score');
  expect(options.cloudVariables.custom).toEqual({[renamedVariable]: 'local'});
  expect(await resultZip.file('assets/example.txt').async('string')).toBe('preserved');
  expect(project.arrayBuffer).toBe(originalArrayBuffer);
});

test('rejects unsupported project formats when obfuscation is requested', async () => {
  await expect(obfuscateSB3Project({type: 'blob'}, {}, JSZip))
    .rejects.toThrow('Obfuscation is only supported for Scratch 3 projects.');
});
