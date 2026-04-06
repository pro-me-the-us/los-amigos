# Test Cases: White Box vs Black Box Testing

## System Under Test

Login function: - Username: admin - Password: 1234

------------------------------------------------------------------------

# White Box Testing (Code-Aware)

### Test Case 1: Both conditions true

-   Input: username = admin, password = 1234
-   Expected Output: 1
-   Coverage: True && True branch

### Test Case 2: Username correct, password wrong

-   Input: username = admin, password = wrong
-   Expected Output: 0
-   Coverage: True && False branch

### Test Case 3: Username wrong, password correct

-   Input: username = user, password = 1234
-   Expected Output: 0
-   Coverage: False && True branch

### Test Case 4: Both wrong

-   Input: username = user, password = wrong
-   Expected Output: 0
-   Coverage: False && False branch

------------------------------------------------------------------------

# Black Box Testing (Functional)

### Test Case 1: Valid login

-   Input: admin, 1234
-   Expected Output: Login success

### Test Case 2: Invalid password

-   Input: admin, wrong
-   Expected Output: Login failure

### Test Case 3: Invalid username

-   Input: user, 1234
-   Expected Output: Login failure

### Test Case 4: Empty input

-   Input: "",""
-   Expected Output: Error or failure

### Test Case 5: Boundary values

-   Input: very long username/password
-   Expected Output: Handled correctly (no crash)

### Test Case 6: Special characters

-   Input: admin@, 1234#
-   Expected Output: Handled safely

------------------------------------------------------------------------

# Key Differences

  Aspect      White Box Testing     Black Box Testing
  ----------- --------------------- --------------------------
  Knowledge   Internal code known   No code knowledge
  Focus       Logic, branches       Functionality
  Goal        Path coverage         Input-output correctness
