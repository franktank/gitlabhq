/* eslint-disable comma-dangle, object-shorthand, func-names, no-else-return, guard-for-in, no-restricted-syntax, one-var, space-before-function-paren, no-lonely-if, no-continue, brace-style, max-len, quotes */
/* global Vue */
/* global DiscussionMixins */
/* global CommentsStore */

(() => {
  const JumpToDiscussion = Vue.extend({
    mixins: [DiscussionMixins],
    props: {
      discussionId: String
    },
    data: function () {
      return {
        discussions: CommentsStore.state,
      };
    },
    computed: {
      discussion: function () {
        return this.discussions[this.discussionId];
      },
      allResolved: function () {
        return this.unresolvedDiscussionCount === 0;
      },
      showButton: function () {
        if (this.discussionId) {
          if (this.unresolvedDiscussionCount > 1) {
            return true;
          } else {
            return this.discussionId !== this.lastResolvedId;
          }
        } else {
          return this.unresolvedDiscussionCount >= 1;
        }
      },
      lastResolvedId: function () {
        let lastId;
        for (const discussionId in this.discussions) {
          const discussion = this.discussions[discussionId];

          if (!discussion.isResolved()) {
            lastId = discussion.id;
          }
        }
        return lastId;
      }
    },
    methods: {
      jumpToNextUnresolvedDiscussion: function () {
        let discussionsSelector;
        let discussionIdsInScope;
        let firstUnresolvedDiscussionId;
        let nextUnresolvedDiscussionId;
        let activeTab = window.mrTabs.currentAction;
        let hasDiscussionsToJumpTo = true;
        let jumpToFirstDiscussion = !this.discussionId;

        const discussionIdsForElements = function(elements) {
          return elements.map(function() {
            return $(this).attr('data-discussion-id');
          }).toArray();
        };

        const discussions = this.discussions;

        if (activeTab === 'diffs') {
          discussionsSelector = '.diffs .notes[data-discussion-id]';
          discussionIdsInScope = discussionIdsForElements($(discussionsSelector));

          let unresolvedDiscussionCount = 0;

          for (let i = 0; i < discussionIdsInScope.length; i += 1) {
            const discussionId = discussionIdsInScope[i];
            const discussion = discussions[discussionId];
            if (discussion && !discussion.isResolved()) {
              unresolvedDiscussionCount += 1;
            }
          }

          if (this.discussionId && !this.discussion.isResolved()) {
            // If this is the last unresolved discussion on the diffs tab,
            // there are no discussions to jump to.
            if (unresolvedDiscussionCount === 1) {
              hasDiscussionsToJumpTo = false;
            }
          } else {
            // If there are no unresolved discussions on the diffs tab at all,
            // there are no discussions to jump to.
            if (unresolvedDiscussionCount === 0) {
              hasDiscussionsToJumpTo = false;
            }
          }
        } else if (activeTab !== 'notes') {
          // If we are on the commits or builds tabs,
          // there are no discussions to jump to.
          hasDiscussionsToJumpTo = false;
        }

        if (!hasDiscussionsToJumpTo) {
          // If there are no discussions to jump to on the current page,
          // switch to the notes tab and jump to the first disucssion there.
          window.mrTabs.activateTab('notes');
          activeTab = 'notes';
          jumpToFirstDiscussion = true;
        }

        if (activeTab === 'notes') {
          discussionsSelector = '.discussion[data-discussion-id]';
          discussionIdsInScope = discussionIdsForElements($(discussionsSelector));
        }

        let currentDiscussionFound = false;
        for (let i = 0; i < discussionIdsInScope.length; i += 1) {
          const discussionId = discussionIdsInScope[i];
          const discussion = discussions[discussionId];

          if (!discussion) {
            // Discussions for comments on commits in this MR don't have a resolved status.
            continue;
          }

          if (!firstUnresolvedDiscussionId && !discussion.isResolved()) {
            firstUnresolvedDiscussionId = discussionId;

            if (jumpToFirstDiscussion) {
              break;
            }
          }

          if (!jumpToFirstDiscussion) {
            if (currentDiscussionFound) {
              if (!discussion.isResolved()) {
                nextUnresolvedDiscussionId = discussionId;
                break;
              }
              else {
                continue;
              }
            }

            if (discussionId === this.discussionId) {
              currentDiscussionFound = true;
            }
          }
        }

        nextUnresolvedDiscussionId = nextUnresolvedDiscussionId || firstUnresolvedDiscussionId;

        if (!nextUnresolvedDiscussionId) {
          return;
        }

        let $target = $(`${discussionsSelector}[data-discussion-id="${nextUnresolvedDiscussionId}"]`);

        if (activeTab === 'notes') {
          $target = $target.closest('.note-discussion');

          // If the next discussion is closed, toggle it open.
          if ($target.find('.js-toggle-content').is(':hidden')) {
            $target.find('.js-toggle-button i').trigger('click');
          }
        } else if (activeTab === 'diffs') {
          // Resolved discussions are hidden in the diffs tab by default.
          // If they are marked unresolved on the notes tab, they will still be hidden on the diffs tab.
          // When jumping between unresolved discussions on the diffs tab, we show them.
          $target.closest(".content").show();

          $target = $target.closest("tr.notes_holder");
          $target.show();

          // If we are on the diffs tab, we don't scroll to the discussion itself, but to
          // 4 diff lines above it: the line the discussion was in response to + 3 context
          let prevEl;
          for (let i = 0; i < 4; i += 1) {
            prevEl = $target.prev();

            // If the discussion doesn't have 4 lines above it, we'll have to do with fewer.
            if (!prevEl.hasClass("line_holder")) {
              break;
            }

            $target = prevEl;
          }
        }

        $.scrollTo($target, {
          offset: -($('.navbar-gitlab').outerHeight() + $('.layout-nav').outerHeight())
        });
      }
    }
  });

  Vue.component('jump-to-discussion', JumpToDiscussion);
})();
