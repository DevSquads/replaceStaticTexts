/* eslint-disable no-shadow */
const babelTraverse = require('@babel/traverse');
const fs = require('fs');

class Traverser {
  constructor(opt, visitedNodePaths) {
    function cleanUp(extractedString) {
      if (extractedString === ':') {
        return '';
      }
      return extractedString.replace(/[\t\n]+/gm, ' ').trim();
    }

    function isAcceptableProp(path) {
      return path.node.name.name === 'title'
        || path.node.name.name === 'content'
        || path.node.name.name === 'placeholder'
        || path.node.name.name === 'errMessage'
        || path.node.name.name === 'tip'
        || path.node.name.name === 'buttonText'
        || path.node.name.name === 'confirmBtnText'
        || path.node.name.name === 'cancelBtnText'
        || path.node.name.name === 'sectionTitle'
        || path.node.name.name === 'sectionText'
        || path.node.name.name === 'info';
    }

    function shouldBeIgnored(path) {
      const ignoredPaths = fs.readFileSync('src/ignoredPaths.txt', 'utf8').split(',');
      return ignoredPaths.includes(path.node.name);
    }

    function getNodePath(path) {
      return path.getPathLocation().replace(/\[([0-9]*)\]/gm, '.$1');
    }

    function isVisited(path) {
      if (!visitedNodePaths[getNodePath(path)]) {
        visitedNodePaths[getNodePath(path)] = true;
        return false;
      }
      return true;
    }

    this.traverseAndProcessAbstractSyntaxTree = () => {
      const astVisitors = {
        JSXText(path) {
          if (cleanUp(path.node.value).length !== 0) {
            opt.jsxTextNodeProcessor(path, opt.processedObject);
          }
        },
        JSXExpressionContainer(path) {
          let shouldNotBeIgnored = true;
          path.traverse({
            Identifier(path) {
              if (shouldBeIgnored(path)) {
                shouldNotBeIgnored = false;
              }
            },
          });
          if (shouldNotBeIgnored) {
            path.traverse({
              StringLiteral(path) {
                const nodePath = getNodePath(path);
                if (!nodePath.includes('attribute')) {
                  if (cleanUp(path.node.extra.rawValue).length !== 0) {
                    if (!isVisited(path)) {
                      opt.jsxExpressionContainerNodeProcessor(path, opt.processedObject);
                    }
                  }
                }
              },
              TemplateElement(path) {
                if (!isVisited(path)) {
                  if (cleanUp(path.node.value.raw).length !== 0) {
                    opt.templateElementNodeProcessor(path, opt.processedObject);
                  }
                }
              },
            });
          }
        },
        JSXOpeningElement(path) {
          path.traverse({
            JSXAttribute(path) {
              let shouldNotIgnorePath = true;
              let isAnExpression = false;
              path.traverse({
                JSXExpressionContainer() {
                  isAnExpression = true;
                },
                Identifier(path) {
                  if (shouldBeIgnored(path)) {
                    shouldNotIgnorePath = false;
                  }
                },
                JSXIdentifier(path) {
                  if (shouldBeIgnored(path)) {
                    shouldNotIgnorePath = false;
                  }
                },
              });

              if (isAcceptableProp(path)) {
                if (shouldNotIgnorePath) {
                  path.traverse({
                    StringLiteral(path) {
                      if (!isVisited(path)) {
                        if (cleanUp(path.node.extra.rawValue).length !== 0) {
                          opt.jsxTitleAttributeNodeProcessor(
                            path,
                            opt.processedObject,
                            isAnExpression,
                          );
                        }
                      }
                    },
                    TemplateElement(path) {
                      if (!isVisited(path)) {
                        if (cleanUp(path.node.value.raw).length !== 0) {
                          opt.templateElementNodeProcessor(path, opt.processedObject);
                        }
                      }
                    },
                  });
                }
              }
            },
          });
        },
        ConditionalExpression(path) {
          let shouldNotBeIgnored = true;
          let isAnExpression = false;
          const parent = path.findParent(path => path.getPathLocation());
          if (parent.node.id != null && (
            parent.node.id.name === 'flexDirection'
            || parent.node.id.name === 'layoutType'
            || parent.node.id.name === 'keyboardType'
            || parent.node.id.name === 'fontColor')) {
            shouldNotBeIgnored = false;
          }
          path.traverse({
            Identifier(path) {
              if (shouldBeIgnored(path)) {
                shouldNotBeIgnored = false;
                return;
              }
              path.traverse({
                JSXExpressionContainer() {
                  isAnExpression = true;
                },
              });
            },
            JSXIdentifier(path) {
              if (shouldBeIgnored(path)) {
                shouldNotBeIgnored = false;
                return;
              }
              path.traverse({
                JSXExpressionContainer() {
                  isAnExpression = true;
                },
              });
            },
          });
          if (shouldNotBeIgnored) {
            path.traverse({
              StringLiteral(path) {
                if (!isVisited(path)) {
                  if (path.getPathLocation().includes('alternate') || path.getPathLocation().includes('consequent')) {
                    if (cleanUp(path.node.extra.rawValue).length !== 0) {
                      opt.conditionalExpressionNodeProcessor(
                        path,
                        opt.processedObject,
                        isAnExpression,
                      );
                    }
                  }
                }
              },
              TemplateElement(path) {
                if (!isVisited(path)) {
                  if (cleanUp(path.node.value.raw).length !== 0) {
                    opt.templateElementNodeProcessor(path, opt.processedObject, isAnExpression);
                  }
                }
              },
            });
          }
        },
        AssignmentExpression(path) {
          path.traverse({
            ObjectProperty(path) {
              let shouldNotIgnorePath = true;
              path.traverse({
                Identifier(path) {
                  if (shouldBeIgnored(path)) {
                    shouldNotIgnorePath = false;
                  }
                },
                JSXIdentifier(path) {
                  if (shouldBeIgnored(path)) {
                    shouldNotIgnorePath = false;
                  }
                },
              });
              if (shouldNotIgnorePath) {
                path.traverse({
                  StringLiteral(path) {
                    if (!isVisited(path)) {
                      if (cleanUp(path.node.extra.rawValue).length !== 0) {
                        opt.objectPropertyNodeProcessor(path, opt.processedObject);
                      }
                    }
                  },
                  TemplateElement(path) {
                    if (!isVisited(path)) {
                      if (cleanUp(path.node.value.raw).length !== 0) {
                        opt.templateElementNodeProcessor(path, opt.processedObject);
                      }
                    }
                  },
                });
              }
            },
          });
        },
        VariableDeclaration(path) {
          let shouldNotBeIgnored = true;
          path.traverse({
            Identifier(path) {
              if (shouldBeIgnored(path)) {
                shouldNotBeIgnored = false;
              }
            },
            JSXIdentifier(path) {
              if (shouldBeIgnored(path)) {
                shouldNotBeIgnored = false;
              }
            },
          });
          if (shouldNotBeIgnored) {
            path.traverse({
              ObjectProperty(path) {
                path.traverse({
                  StringLiteral(path) {
                    if (!isVisited(path)) {
                      if (cleanUp(path.node.extra.rawValue).length !== 0) {
                        opt.objectPropertyNodeProcessor(path, opt.processedObject);
                      }
                    }
                  },
                  TemplateElement(path) {
                    if (!isVisited(path)) {
                      if (cleanUp(path.node.value.raw).length !== 0) {
                        opt.templateElementNodeProcessor(path, opt.processedObject);
                      }
                    }
                  },
                });
              },
              ArrayExpression(path) {
                path.traverse({
                  StringLiteral(path) {
                    if (!isVisited(path)) {
                      if (cleanUp(path.node.extra.rawValue).length !== 0) {
                        opt.objectPropertyNodeProcessor(path, opt.processedObject);
                      }
                    }
                  },
                  TemplateElement(path) {
                    if (!isVisited(path)) {
                      if (cleanUp(path.node.value.raw).length !== 0) {
                        opt.templateElementNodeProcessor(path, opt.processedObject);
                      }
                    }
                  },
                });
              },
            });
          }
        },
        CallExpression(path) {
          let shouldNotBeIgnored = true;
          path.traverse({
            Identifier(path) {
              if (shouldBeIgnored(path)) {
                shouldNotBeIgnored = false;
              }
            },
            JSXIdentifier(path) {
              if (shouldBeIgnored(path)) {
                shouldNotBeIgnored = false;
              }
            },
          });
          if (shouldNotBeIgnored) {
            path.traverse({
              StringLiteral(path) {
                if (path.getPathLocation().includes('arguments')) {
                  if (!isVisited(path)) {
                    if (cleanUp(path.node.extra.rawValue).length !== 0) {
                      opt.callExpressionNodeProcessor(path, opt.processedObject);
                    }
                  }
                }
              },
              TemplateElement(path) {
                if (!isVisited(path)) {
                  if (cleanUp(path.node.value.raw).length !== 0) {
                    opt.templateElementNodeProcessor(path, opt.processedObject);
                  }
                }
              },
            });
          }
        },
        Function(path) {
          // console.log(path);
          if (path.node.key != null
            && (path.node.key.name === 'calculateKeyboardType'
              || path.node.key.name === 'processOutgoingValue'
              || path.node.key.name === 'getBackgroundColors')) {
            return;
          }
          path.traverse({
            ReturnStatement(path) {
              let shouldNotBeIgnored = true;

              path.traverse({
                Identifier(path) {
                  if (shouldBeIgnored(path)) {
                    shouldNotBeIgnored = false;
                  }
                },
                JSXIdentifier(path) {
                  if (shouldBeIgnored(path)) {
                    shouldNotBeIgnored = false;
                  }
                },
              });
              if (shouldNotBeIgnored) {
                path.traverse({
                  StringLiteral(path) {
                    if (path.getPathLocation().includes('argument') && !path.getPathLocation().includes('expression')) {
                      if (!isVisited(path)) {
                        if (cleanUp(path.node.extra.rawValue).length !== 0) {
                          opt.returnExpressionNodeProcessor(path, opt.processedObject);
                        }
                      }
                    }
                  },
                  TemplateElement(path) {
                    if (!isVisited(path) && !path.getPathLocation().includes('expression')) {
                      if (cleanUp(path.node.value.raw).length !== 0) {
                        opt.templateElementNodeProcessor(path, opt.processedObject);
                      }
                    }
                  },
                });
              }
            },
          });
        },
      };

      babelTraverse.default(opt.parsedTree, astVisitors);
      return opt.processedObject;
    };
  }
}

module.exports = Traverser;
