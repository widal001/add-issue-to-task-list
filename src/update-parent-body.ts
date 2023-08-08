import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import {visit, EXIT} from 'unist-util-visit'
// import {gfmTaskListItemFromMarkdown} from 'mdast-util-gfm-task-list-item'

interface IssueMetadata {
  parentBody: string
  taskListName: string
  issueNumber: number
}

interface Node {
  type: string
  value?: string
  checked?: boolean
  spread?: boolean
}

interface ParentNode extends Node {
  children?: ParentNode[]
}

function createListItem(issueNumber: number): ParentNode {
  return {
    type: 'listItem',
    checked: false,
    spread: false,
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            value: `#${issueNumber}`
          }
        ]
      }
    ]
  }
}

function getTaskListIndex(tree: ParentNode, taskListName: string): number {
  let taskListIndex = -1

  visit(tree, 'heading', (node: ParentNode, index: number) => {
    if (node.children && node.children[0].value === taskListName) {
      taskListIndex = index + 1
      return EXIT
    }
  })

  return taskListIndex
}

function listContainsTrackedIssue(
  taskList: Node,
  issueNumber: number
): boolean {
  let containsIssue = false
  if (taskList.type !== 'list') {
    return true
  }
  visit(taskList, 'paragraph', (node: ParentNode) => {
    if (node.children && node.children[0].value === `#${issueNumber}`) {
      containsIssue = true
      return EXIT
    }
  })
  return containsIssue
}

function appendIssueIfMissing(taskList: ParentNode, issueNumber: number): void {
  if (taskList.children === undefined) {
    taskList.children = []
  }
  if (listContainsTrackedIssue(taskList, issueNumber) !== true) {
    const newItem = createListItem(issueNumber)
    taskList.children.push(newItem)
  }
}

function addTrackedIssue(listName: string, issueNumber: number) {
  return (tree: ParentNode) => {
    const taskListIndex = getTaskListIndex(tree, listName)

    // if the task list index is within a valid range
    if (
      tree.children &&
      taskListIndex > 0 &&
      taskListIndex <= tree.children.length
    ) {
      // Add the tracked issue to the task list
      const taskList = tree.children[taskListIndex]
      appendIssueIfMissing(taskList, issueNumber)
    }
  }
}

async function updateParentIssueBody(inputs: IssueMetadata): Promise<string> {
  try {
    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(addTrackedIssue, inputs.taskListName, inputs.issueNumber)
      .use(remarkStringify, {bullet: '-'})

    const file = await processor.process(inputs.parentBody)
    return String(file)
  } catch (error) {
    throw error // Rethrow the error or handle it as needed
  }
}

export default updateParentIssueBody
