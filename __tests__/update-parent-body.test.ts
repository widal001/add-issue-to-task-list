import {expect, test} from 'vitest'
import updateParentIssueBody from '../src/update-parent-body'

test('hello world', async () => {
  const hello = 'Hello World'
  expect(hello).toBe('Hello World')
})

test('no change if child issue already found in task list', async () => {
  const parentBody = `### Sub-Tasks

-   [ ] \\#25
-   [ ] \\#26
`
  const taskListName = 'Sub-Tasks'
  const issueNumber = 25
  const inputs = {
    parentBody,
    taskListName,
    issueNumber
  }
  const outputReceived = await updateParentIssueBody(inputs)
  console.log('OutputExpected')
  console.log(parentBody)
  console.log('OutputReceived')
  console.log(outputReceived)
  expect(outputReceived).toBe(parentBody)
})

test('append child issue if not found in task list', async () => {
  const parentBody = `
### Sub-Tasks
  
-   [ ] #26
`
  const outputWanted = `### Sub-Tasks

-   [ ] \\#26
-   [ ] \\#25
`
  const taskListName = 'Sub-Tasks'
  const issueNumber = 25
  const inputs = {
    parentBody,
    taskListName,
    issueNumber
  }
  const outputReceived = await updateParentIssueBody(inputs)
  console.log('OutputReceived')
  console.log(outputReceived)
  expect(outputReceived).toBe(outputWanted)
})
