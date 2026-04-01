import { execSync } from 'child_process';

const patterns = [
  'gamificationService.ts',
  'inviteService.ts',
  'errors.ts',
  'AcceptInvite.smoke.test.tsx',
];

for (const pattern of patterns) {
  try {
    const result = execSync(
      `Get-ChildItem -Recurse -Filter "${pattern}" src/ | Select-Object -ExpandProperty FullName`,
      { cwd: 'c:\\Users\\loays\\impact-matrix\\tammal\\tammal-development-code\\tammal', shell: 'powershell.exe', encoding: 'utf8' }
    );
    console.log(`\n${pattern}:\n${result.trim()}`);
  } catch (e) {
    console.log(`${pattern}: NOT FOUND`);
  }
}
