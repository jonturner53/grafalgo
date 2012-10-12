# Top level makefile, order of lower-level makes matters
SHELL := /bin/bash
JROOT := ~/bin/java

all:
	make -C misc            JROOT='${JROOT}' all
	make -C dataStructures  JROOT='${JROOT}' all
	make -C graphAlgorithms JROOT='${JROOT}' all
	make -C dataStructures  IDIR='${IDIR}' LDIR='${LDIR}' BIN='${BIN}' \
				CXXFLAGS='${CXXFLAGS}' all
	make -C graphAlgorithms IDIR='${IDIR}' LDIR='${LDIR}' BIN='${BIN}' \
				CXXFLAGS='${CXXFLAGS}' all

clean:
	make -C misc            clean
	make -C dataStructures  clean
	make -C graphAlgorithms clean

