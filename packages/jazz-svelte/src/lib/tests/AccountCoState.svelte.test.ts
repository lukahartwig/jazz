import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, beforeEach } from 'vitest';
import { createJazzTestAccount, createJazzTestContext, setupJazzTestSync } from '../testing.js';
import UpdateNestedValueAccount from './components/CoState/UpdateNestedValueAccount.svelte';
import { MyAccount } from './components/CoState/schema.js';

beforeEach(async () => {
  await setupJazzTestSync();
  await createJazzTestAccount({
    AccountSchema: MyAccount,
    isCurrentActiveAccount: true
  });
});

function setup() {
  const result = render(UpdateNestedValueAccount, {
    context: createJazzTestContext(),
  });

  return {
    ...result,
    nameInput: screen.getByLabelText('Name'),
    dogNameInput: screen.getByLabelText('Dog'),
    personNameOutput: screen.getByTestId('person-name'),
    personDogNameOutput: screen.getByTestId('person-dog-name')
  };
}
describe('AccountCoState', () => {
  it('should show the and update properties', async () => {
    const me = MyAccount.getMe()

    const { nameInput, personNameOutput } = setup();

    expect(nameInput).toHaveValue(me.root!.name);

    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Jane');

    expect(nameInput).toHaveValue('Jane');
    expect(personNameOutput).toHaveTextContent('Jane');
  });

  it('should show the and update nested properties', async () => {
    const me = MyAccount.getMe()

    const { dogNameInput, personDogNameOutput } = setup();

    expect(dogNameInput).toHaveValue(me.root!.dog!.name);

    await userEvent.clear(dogNameInput);
    await userEvent.type(dogNameInput, 'Fuffy');

    expect(dogNameInput).toHaveValue('Fuffy');
    expect(personDogNameOutput).toHaveTextContent('Fuffy');
  });
});
