module Gitlab
  module View
    module Presenter
      module Base
        extend ActiveSupport::Concern

        include Gitlab::Routing
        include Gitlab::Allowable

        attr_reader :subject

        def can?(user, action, overriden_subject = nil)
          super(user, action, overriden_subject || subject)
        end

        class_methods do
          def presenter?
            true
          end

          def presents(name)
            define_method(name) { subject }
          end
        end
      end
    end
  end
end
