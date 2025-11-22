// Simple test to verify the Chatbot component can be imported
describe('Chatbot', () => {
  test('can be imported', () => {
    const Chatbot = require('./Chatbot').default;
    expect(Chatbot).toBeDefined();
  });
});
