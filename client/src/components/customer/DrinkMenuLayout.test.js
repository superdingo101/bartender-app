import fs from 'fs';
import path from 'path';

const readCustomerCss = (fileName) =>
  fs.readFileSync(path.join(__dirname, fileName), 'utf8');

describe('customer drink menu mobile layout CSS regression guard', () => {
  it('sizes drink grid rows to card content and keeps the mobile grid as the scroll container', () => {
    const css = readCustomerCss('DrinkMenu.css');

    expect(css).toMatch(/\.drinks-grid\s*{[\s\S]*display:\s*grid;/);
    expect(css).toMatch(/\.drinks-grid\s*{[\s\S]*grid-auto-rows:\s*max-content;/);
    expect(css).toMatch(/\.drinks-grid\s*{[\s\S]*align-content:\s*start;/);
    expect(css).toMatch(/@media\s*\(max-width:\s*768px\)\s*{[\s\S]*\.drinks-grid\s*{[\s\S]*grid-template-columns:\s*1fr;[\s\S]*grid-auto-rows:\s*max-content;[\s\S]*overflow-y:\s*auto;/);
  });

  it('keeps drink cards and their content in normal flow on mobile', () => {
    const css = readCustomerCss('DrinkCard.css');

    expect(css).toMatch(/\.drink-card\s*{[\s\S]*display:\s*flex;[\s\S]*flex-direction:\s*column;[\s\S]*height:\s*auto;[\s\S]*max-height:\s*none;/);
    expect(css).toMatch(/\.drink-info\s*{[\s\S]*flex:\s*0 0 auto;[\s\S]*overflow:\s*visible;/);
    expect(css).toMatch(/@media\s*\(max-width:\s*640px\)\s*{[\s\S]*\.drink-image\s*{[\s\S]*flex:\s*0 0 180px;[\s\S]*height:\s*180px;/);
    expect(css).toMatch(/@media\s*\(max-width:\s*640px\)\s*{[\s\S]*\.drink-info\s*{[\s\S]*flex:\s*0 0 auto;[\s\S]*overflow:\s*visible;/);
  });
});
