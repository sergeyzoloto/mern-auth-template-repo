import React from 'react';
import { MemoryRouter } from 'react-router-dom';

/**
 * We use the App component to test here as it will do the routing for us.
 * This allows our test to be more user centric!
 */
import App from '../../../../App.jsx';

import {
  render,
  fireEvent,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';

import CreateUser from '../CreateUser';
import TEST_ID_CREATE_USER from '../CreateUser.testid.js';
import {
  createUserSuccessMock,
  createUserFailedMock,
} from '../../../../__testUtils__/fetchUserMocks';

beforeEach(() => {
  fetch.resetMocks();
});

describe('CreateUser', () => {
  it('Renders without a problem', () => {
    render(<CreateUser />);

    expect(
      screen.getByTestId(TEST_ID_CREATE_USER.container),
    ).toBeInTheDocument();
  });

  it('Should be able to change password and email input', () => {
    const testPassword = 'John';
    const testEmail = 'john@doe.com';

    render(<CreateUser />);

    // Check initially fields are empty
    expect(screen.getByTestId(TEST_ID_CREATE_USER.passwordInput).value).toEqual(
      '',
    );
    expect(screen.getByTestId(TEST_ID_CREATE_USER.emailInput).value).toEqual(
      '',
    );

    // Change fields
    fireEvent.change(screen.getByTestId(TEST_ID_CREATE_USER.passwordInput), {
      target: { value: testPassword },
    });
    fireEvent.change(screen.getByTestId(TEST_ID_CREATE_USER.emailInput), {
      target: { value: testEmail },
    });

    // Check fields have changed value
    expect(screen.getByTestId(TEST_ID_CREATE_USER.passwordInput).value).toEqual(
      testPassword,
    );
    expect(screen.getByTestId(TEST_ID_CREATE_USER.emailInput).value).toEqual(
      testEmail,
    );
  });

  it('Should send the input values to the server on clicking submit and indicate loading states', async () => {
    const testPassword = 'John';
    const testEmail = 'john@doe.com';

    // Mock our fetch
    fetch.mockResponseOnce(createUserSuccessMock());

    render(
      <MemoryRouter history={history} initialEntries={['/user/create']}>
        <App />
      </MemoryRouter>,
    );

    // Fill in our fields
    fireEvent.change(screen.getByTestId(TEST_ID_CREATE_USER.passwordInput), {
      target: { value: testPassword },
    });
    fireEvent.change(screen.getByTestId(TEST_ID_CREATE_USER.emailInput), {
      target: { value: testEmail },
    });

    // Make sure fetch hasn't been called yet
    expect(fetch.mock.calls.length).toEqual(0);

    // Check that there is no loading indicator initially
    expect(
      await screen.queryByTestId(TEST_ID_CREATE_USER.loadingContainer),
    ).not.toBeInTheDocument();

    // Click submit
    fireEvent.click(screen.getByTestId(TEST_ID_CREATE_USER.submitButton));

    // Wait for the loading to be shown
    expect(
      screen.getByTestId(TEST_ID_CREATE_USER.loadingContainer),
    ).toBeInTheDocument();

    // Wait for the loading state to be removed
    await waitForElementToBeRemoved(
      screen.getByTestId(TEST_ID_CREATE_USER.loadingContainer),
    );

    // Check that the right endpoint was called
    expect(fetch.mock.calls[0][0]).toContain('api/user/register');
    // Check the right data is given. We need the second argument ([1]) of the first call ([0])
    expect(fetch.mock.calls[0][1].body).toEqual(
      // We need to stringify as we send the information as a string
      JSON.stringify({
        user: { email: testEmail, password: testPassword },
      }),
    );
  });

  it('Should show an error state if the creation is unsuccessful', async () => {
    const testPassword = 'John';
    const testEmail = 'john@doe.com';

    // Mock our fetch
    fetch.mockResponseOnce(createUserFailedMock());

    render(<CreateUser />);

    // Fill in our fields
    fireEvent.change(screen.getByTestId(TEST_ID_CREATE_USER.passwordInput), {
      target: { value: testPassword },
    });
    fireEvent.change(screen.getByTestId(TEST_ID_CREATE_USER.emailInput), {
      target: { value: testEmail },
    });

    // Check that there is no error indicator initially
    expect(
      screen.queryByTestId(TEST_ID_CREATE_USER.errorContainer),
    ).not.toBeInTheDocument();

    // Click submit
    fireEvent.click(screen.getByTestId(TEST_ID_CREATE_USER.submitButton));

    // Wait to see the error component
    waitFor(() =>
      expect(
        screen.findByTestId(TEST_ID_CREATE_USER.errorContainer),
      ).toBeInTheDocument(),
    );

    // Check to see that the fields are still filled in
    expect(screen.getByTestId(TEST_ID_CREATE_USER.passwordInput).value).toEqual(
      testPassword,
    );
    expect(screen.getByTestId(TEST_ID_CREATE_USER.emailInput).value).toEqual(
      testEmail,
    );
  });
});
