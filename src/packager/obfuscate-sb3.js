import * as ExtendedJSON from '@turbowarp/json';
import CapivaraObfuscator from './capivara-obfuscator';

const obfuscateSB3Project = async (project, options, JSZip) => {
  if (project.type !== 'sb3') {
    throw new Error('Obfuscation is only supported for Scratch 3 projects.');
  }

  const zip = await JSZip.loadAsync(project.arrayBuffer);
  const projectFile = zip.file('project.json');
  if (!projectFile) {
    throw new Error('project.json not found inside the Scratch 3 project.');
  }

  const projectData = ExtendedJSON.parse(await projectFile.async('string'));
  const stage = projectData.targets.find((target) => target.isStage);
  const oldNamesById = new Map();
  if (stage) {
    for (const [id, variable] of Object.entries(stage.variables || {})) {
      oldNamesById.set(id, variable[0]);
    }
  }

  CapivaraObfuscator.obfuscate(projectData);

  if (stage && options.cloudVariables) {
    const renamedVariables = new Map();
    for (const [id, oldName] of oldNamesById) {
      const variable = stage.variables[id];
      if (variable) {
        renamedVariables.set(oldName, variable[0]);
      }
    }
    options.cloudVariables.custom = Object.fromEntries(
      Object.entries(options.cloudVariables.custom || {}).map(([name, provider]) => [
        renamedVariables.get(name) || name,
        provider
      ])
    );
  }

  zip.file('project.json', ExtendedJSON.stringify(projectData));
  return {
    ...project,
    arrayBuffer: await zip.generateAsync({
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: {level: 9}
    })
  };
};

export default obfuscateSB3Project;
