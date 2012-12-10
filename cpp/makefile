# Top level makefile, order of lower-level makes matters
SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := include
LDIR := lib
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2

all:
	make -C misc            IDIR='../${IDIR}' LDIR='../${LDIR}' \
				WARN='${WARN}' ARCH='${ARCH}' \
				BIN='${BIN}' CXXFLAGS='${CXXFLAGS}' all
	make -C dataStructures  IDIR='../${IDIR}' LDIR='../${LDIR}' \
				WARN='${WARN}' ARCH='${ARCH}' \
				BIN='${BIN}' CXXFLAGS='${CXXFLAGS}' all
	make -C graphAlgorithms IDIR='../${IDIR}' LDIR='../${LDIR}' \
				WARN='${WARN}' ARCH='${ARCH}' \
				BIN='${BIN}' CXXFLAGS='${CXXFLAGS}' all

clean:
	rm -f ${LDIR}/*.a
	make -C misc            clean
	make -C dataStructures  clean
	make -C graphAlgorithms clean

